import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { fetchQRCodeByProductId } from "./fetchQRCode.js";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const productId = shopify.product.id;
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [qrCode, setQrCode] = useState(
    /** @type {Awaited<ReturnType<typeof fetchQRCodeByProductId>>} */ (null),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadQRCode() {
      setLoading(true);
      setErrorMessage("");
      setQrCode(null);

      try {
        const record = await fetchQRCodeByProductId(productId);

        if (cancelled) {
          return;
        }

        if (!record) {
          setErrorMessage(shopify.i18n.translate("block_not_found"));
          return;
        }

        setQrCode(record);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : shopify.i18n.translate("block_error"),
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadQRCode();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <s-pos-block heading={shopify.i18n.translate("block_heading")}>
      {loading ? <s-text>{shopify.i18n.translate("block_loading")}</s-text> : null}

      {!loading && qrCode ? (
        <s-stack direction="block" gap="small">
          <s-text>{qrCode.productTitle ?? qrCode.title}</s-text>
          <s-text>
            {shopify.i18n.translate("scans_label")}: {qrCode.scans}
          </s-text>
          <s-text>
            {shopify.i18n.translate("destination_label")}:{" "}
            {qrCode.destination === "cart"
              ? shopify.i18n.translate("destination_cart")
              : shopify.i18n.translate("destination_product")}
          </s-text>
        </s-stack>
      ) : null}

      {!loading && errorMessage ? <s-text>{errorMessage}</s-text> : null}
    </s-pos-block>
  );
}
