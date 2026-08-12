import { useEffect, useState } from "react";
import {
  extend,
  render,
  useExtensionInput,
  BlockStack,
  Button,
  CalloutBanner,
  Heading,
  Image,
  Text,
  TextContainer,
  Separator,
  Tiles,
  TextBlock,
  Layout,
  View,
} from "@shopify/post-purchase-ui-extensions-react";

// Dev-only: run `pnpm sync:app-url` after starting `shopify app dev`.
// Production: set this to your deployed app URL before deploy.
const APP_URL = "https://cdna-wallet-gazette-knew.trycloudflare.com";

function getPurchasedVariantIds(initialPurchase) {
  return (
    initialPurchase?.lineItems?.map((line) => line.product?.variant?.id) ?? []
  );
}

// Preload data from your app server to ensure that the extension loads quickly.
extend(
  "Checkout::PostPurchase::ShouldRender",
  async ({ inputData, storage }) => {
    try {
      const response = await fetch(`${APP_URL}/api/offer`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${inputData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceId: inputData.initialPurchase.referenceId,
          shop: inputData.shop.domain,
          purchasedVariantIds: getPurchasedVariantIds(inputData.initialPurchase),
        }),
      });

      if (!response.ok) {
        throw new Error(`Offer request failed with status ${response.status}`);
      }

      const postPurchaseOffer = await response.json();

      if (!postPurchaseOffer.offers?.length) {
        return { render: false };
      }

      await storage.update(postPurchaseOffer);
    } catch (error) {
      console.error("Post-purchase offer fetch failed:", error);
      return { render: false };
    }

    return { render: true };
  }
);

render("Checkout::PostPurchase::Render", () => <App />);

export function App() {
  const { storage, inputData, calculateChangeset, applyChangeset, done } =
    useExtensionInput();
  const [calculating, setCalculating] = useState(true);
  const [paying, setPaying] = useState(false);
  const [calculatedPurchase, setCalculatedPurchase] = useState();
  const [errorMessage, setErrorMessage] = useState("");

  const { offers = [] } = storage.initialData ?? {};
  const purchaseOption = offers[0];

  function declineOffer() {
    done();
  }

  useEffect(() => {
    async function calculatePurchase() {
      if (!purchaseOption?.changes) {
        setCalculating(false);
        return;
      }

      try {
        const result = await calculateChangeset({
          changes: purchaseOption.changes,
        });

        if (result.status === "processed" && result.calculatedPurchase) {
          setCalculatedPurchase(result.calculatedPurchase);
        } else {
          console.error("Post-purchase calculate failed:", result.errors);
          setErrorMessage(
            result.errors?.[0]?.message ??
              "Could not calculate the offer price.",
          );
        }
      } catch (error) {
        console.error("Failed to calculate post-purchase offer:", error);
        setErrorMessage("Could not calculate the offer price.");
      } finally {
        setCalculating(false);
      }
    }

    calculatePurchase();
  }, [calculateChangeset, purchaseOption?.changes]);

  if (!purchaseOption) {
    return (
      <BlockStack spacing="loose">
        <CalloutBanner>
          <TextContainer>
            <Text size="medium">No offer is available right now.</Text>
          </TextContainer>
        </CalloutBanner>
        <Button onPress={declineOffer}>Continue to order confirmation</Button>
      </BlockStack>
    );
  }

  // Extract values from the calculated purchase.
  const shipping =
    calculatedPurchase?.addedShippingLines?.[0]?.priceSet?.presentmentMoney
      ?.amount;
  const taxes =
    calculatedPurchase?.addedTaxLines?.[0]?.priceSet?.presentmentMoney?.amount;
  const total =
    calculatedPurchase?.totalOutstandingSet?.presentmentMoney?.amount;
  const offeredVariantId =
    purchaseOption.variantId ?? purchaseOption.changes?.[0]?.variantID;
  const offeredLineItem = calculatedPurchase?.updatedLineItems?.find(
    (item) => item.variantId === offeredVariantId,
  );
  const discountedPrice =
    offeredLineItem?.totalPriceSet?.presentmentMoney?.amount;
  const originalPrice = offeredLineItem?.priceSet?.presentmentMoney?.amount;
  const discountTitle =
    purchaseOption.changes?.[0]?.discount?.title ?? "a special discount";

  async function acceptOffer() {
    if (!calculatedPurchase || !total || paying) {
      return;
    }

    setPaying(true);
    setErrorMessage("");

    try {
      const signResponse = await fetch(`${APP_URL}/api/sign-changeset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${inputData.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceId: inputData.initialPurchase.referenceId,
          shop: inputData.shop.domain,
          offerId: purchaseOption.id,
        }),
      });

      if (!signResponse.ok) {
        throw new Error("Failed to sign post-purchase changeset.");
      }

      const { token } = await signResponse.json();

      if (!token) {
        throw new Error("Missing signed post-purchase token.");
      }

      const result = await applyChangeset(token);

      if (
        result.status === "processed" ||
        result.errors?.some((error) => error.code === "changeset_already_applied")
      ) {
        done();
        return;
      }

      const message =
        result.errors?.[0]?.message ??
        "Could not add this product to your order.";
      console.error("Failed to apply post-purchase offer:", result.errors);
      setErrorMessage(message);
      setPaying(false);
    } catch (error) {
      console.error("Post-purchase payment failed:", error);
      setErrorMessage("Something went wrong while processing your offer.");
      setPaying(false);
    }
  }

  return (
    <BlockStack spacing="loose">
      <CalloutBanner>
        <BlockStack spacing="tight">
          <TextContainer>
            <Text size="medium" emphasized>
              It&#39;s not too late to add this to your order
            </Text>
          </TextContainer>
          <TextContainer>
            <Text size="medium">
              Add the {purchaseOption.productTitle} to your order and{" "}
            </Text>
            <Text size="medium" emphasized>
              {discountTitle}
            </Text>
          </TextContainer>
        </BlockStack>
      </CalloutBanner>
      <Layout
        media={[
          { viewportSize: "small", sizes: [1, 0, 1], maxInlineSize: 0.9 },
          { viewportSize: "medium", sizes: [532, 0, 1], maxInlineSize: 420 },
          { viewportSize: "large", sizes: [560, 38, 340] },
        ]}
      >
        {purchaseOption.productImageURL ? (
          <View>
            <Image
              description={purchaseOption.productTitle}
              source={purchaseOption.productImageURL}
              aspectRatio={1}
              fit="contain"
              bordered
            />
          </View>
        ) : (
          <BlockStack />
        )}
        <BlockStack />
        <BlockStack>
          <Heading>{purchaseOption.productTitle}</Heading>
          <PriceHeader
            discountedPrice={discountedPrice}
            originalPrice={originalPrice}
            loading={calculating}
          />
          <ProductDescription textLines={purchaseOption.productDescription} />
          <BlockStack spacing="tight">
            <Separator />
            <MoneyLine
              label="Subtotal"
              amount={discountedPrice}
              loading={calculating}
            />
            <MoneyLine
              label="Shipping"
              amount={shipping}
              loading={calculating}
            />
            <MoneyLine
              label="Taxes"
              amount={taxes}
              loading={calculating}
            />
            <Separator />
            <MoneySummary label="Total" amount={total} />
          </BlockStack>
          <BlockStack>
            {errorMessage ? (
              <CalloutBanner>
                <TextContainer>
                  <Text size="medium" appearance="critical">
                    {errorMessage}
                  </Text>
                </TextContainer>
              </CalloutBanner>
            ) : null}
            <Button
              onPress={acceptOffer}
              loading={paying}
              disabled={calculating || paying || !calculatedPurchase || !total}
            >
              Pay now · {formatCurrency(total)}
            </Button>
            <Button onPress={declineOffer} subdued disabled={paying}>
              Decline this offer
            </Button>
          </BlockStack>
        </BlockStack>
      </Layout>
    </BlockStack>
  );
}

function PriceHeader({ discountedPrice, originalPrice, loading }) {
  return (
    <TextContainer alignment="leading" spacing="loose">
      <Text role="deletion" size="large">
        {!loading && formatCurrency(originalPrice)}
      </Text>
      <Text emphasized size="large" appearance="critical">
        {" "}
        {!loading && formatCurrency(discountedPrice)}
      </Text>
    </TextContainer>
  );
}

function ProductDescription({ textLines = [] }) {
  return (
    <BlockStack spacing="xtight">
      {textLines.map((text, index) => (
        <TextBlock key={index} subdued>
          {text}
        </TextBlock>
      ))}
    </BlockStack>
  );
}

function MoneyLine({ label, amount, loading = false }) {
  return (
    <Tiles>
      <TextBlock size="small">{label}</TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="small">
          {loading ? "-" : formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function MoneySummary({ label, amount }) {
  return (
    <Tiles>
      <TextBlock size="medium" emphasized>
        {label}
      </TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="medium">
          {formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function formatCurrency(amount) {
  if (!amount || parseInt(amount, 10) === 0) {
    return "Free";
  }
  return `$${amount}`;
}