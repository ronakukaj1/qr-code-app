import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

/**
 * @typedef {import('@shopify/ui-extensions/checkout').CartLine} CartLine
 * @typedef {import('@shopify/ui-extensions/checkout').I18n} I18n
 * @typedef {{
 *   id: string;
 *   title: string;
 *   images: { nodes: Array<{ url: string }> };
 *   variants: { nodes: Array<{ id: string; price: { amount: string } }> };
 * }} Product
 * @typedef {{ products: { nodes: Product[] } }} ProductsQueryData
 */

// 1. Export the extension
export default function () {
  render(<Extension />, document.body);
}

function Extension() {
  const { applyCartLinesChange, query, i18n } = shopify;
  const [products, setProducts] = useState(/** @type {Product[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showError, setShowError] = useState(false);
  const [fetchError, setFetchError] = useState(/** @type {string | null} */ (null));
  const { lines } = shopify;

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  /** @param {string} variantId */
  async function handleAddToCart(variantId) {
    setAdding(true);
    const result = await applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: variantId,
      quantity: 1,
    });
    setAdding(false);
    if (result.type === "error") {
      setShowError(true);
      console.error(result.message);
    }
  }

  async function fetchProducts() {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, errors } = await query(
        `query ($first: Int!) {
          products(first: $first, query: "available_for_sale:true") {
            nodes {
              id
              title
              images(first:1){
                nodes {
                  url
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                  }
                }
              }
            }
          }
        }`,
        {
          variables: { first: 5 },
        }
      );

      if (errors?.length) {
        throw new Error(errors.map((error) => error.message).join(", "));
      }

      const productsData = /** @type {ProductsQueryData | undefined} */ (data);
      const loadedProducts = (productsData?.products.nodes ?? []).filter(
        (product) =>
          !/gift card/i.test(product.title) &&
          product.variants.nodes[0]?.id != null,
      );
      setProducts(loadedProducts);
    } catch (error) {
      console.error(error);
      setFetchError(
        error instanceof Error ? error.message : "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (fetchError) {
    return (
      <s-stack gap="large-200">
        <s-divider />
        <s-banner tone="critical">{fetchError}</s-banner>
      </s-stack>
    );
  }

  const productsOnOffer = getProductsOnOffer(lines.value, products);

  if (!products.length) {
    return (
      <s-stack gap="large-200">
        <s-divider />
        <s-banner tone="info">
          No products found. Make sure products are published to the Online Store
          sales channel.
        </s-banner>
      </s-stack>
    );
  }

  if (!productsOnOffer.length) {
    return (
      <s-stack gap="large-200">
        <s-divider />
        <s-banner tone="info">
          All recommended products are already in the cart.
        </s-banner>
      </s-stack>
    );
  }

  return (
    <ProductOffer
      product={productsOnOffer[0]}
      i18n={i18n}
      adding={adding}
      handleAddToCart={handleAddToCart}
      showError={showError}
    />
  );
}

function LoadingSkeleton() {
  return (
    <s-stack gap="large-200">
      <s-divider />
      <s-heading>You might also like</s-heading>
      <s-stack gap="base">
        <s-grid
          gap="base"
          gridTemplateColumns="64px 1fr auto"
          alignItems="center"
        >
          <s-image loading="lazy" />
          <s-stack gap="none">
            <s-skeleton-paragraph />
            <s-skeleton-paragraph />
          </s-stack>
          <s-button variant="secondary" disabled={true}>
            Add
          </s-button>
        </s-grid>
      </s-stack>
    </s-stack>
  );
}

/**
 * @param {CartLine[]} lines
 * @param {Product[]} products
 * @returns {Product[]}
 */
function getProductsOnOffer(lines, products) {
  const cartLineProductVariantIds = lines.map((item) => item.merchandise.id);
  return products.filter((product) => {
    const isProductVariantInCart = product.variants.nodes.some(({ id }) =>
      cartLineProductVariantIds.includes(id)
    );
    return !isProductVariantInCart;
  });
}

/**
 * @param {{
 *   product: Product;
 *   i18n: I18n;
 *   adding: boolean;
 *   handleAddToCart: (variantId: string) => Promise<void>;
 *   showError: boolean;
 * }} props
 */
function ProductOffer({ product, i18n, adding, handleAddToCart, showError }) {
  const { images, title, variants } = product;
  const variant = variants.nodes[0];

  if (!variant) {
    return null;
  }

  const renderPrice = i18n.formatCurrency(Number(variant.price.amount));
  const imageUrl =
    images.nodes[0]?.url ??
    "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081";

  return (
    <s-stack gap="large-200">
      <s-divider />
      <s-heading>You might also like</s-heading>
      <s-stack gap="base">
        <s-grid
          gap="base"
          gridTemplateColumns="64px 1fr auto"
          alignItems="center"
        >
          <s-image
            borderWidth="base"
            borderRadius="large-100"
            src={imageUrl}
            alt={title}
            aspectRatio="1"
          />
          <s-stack gap="none">
            <s-text type="strong">{title}</s-text>
            <s-text color="subdued">{renderPrice}</s-text>
          </s-stack>
          <s-button
            variant="secondary"
            loading={adding}
            accessibilityLabel={`Add ${title} to cart`}
            onClick={() => handleAddToCart(variant.id)}
          >
            Add
          </s-button>
        </s-grid>
      </s-stack>
      {showError && <ErrorBanner />}
    </s-stack>
  );
}

function ErrorBanner() {
  return (
    <s-banner tone="critical">
      There was an issue adding this product. Please try again.
    </s-banner>
  );
}