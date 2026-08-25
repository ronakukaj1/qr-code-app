import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { i18n, data } = shopify;
  const [src, setSrc] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(true);
  const [printPackingSlip, setPrintPackingSlip] = useState(false);

  const orderId = data.selected[0]?.id;

  useEffect(() => {
    const printTypes = [];

    if (printInvoice) {
      printTypes.push("Invoice");
    }

    if (printPackingSlip) {
      printTypes.push("Packing Slip");
    }

    if (printTypes.length && orderId) {
      const params = new URLSearchParams({
        printType: printTypes.join(","),
        orderId,
      });

      setSrc(`/print?${params.toString()}`);
    } else {
      setSrc(null);
    }
  }, [data.selected, printInvoice, printPackingSlip]);

  return (
    <s-admin-print-action src={src}>
      <s-stack direction="block">
        <s-text type="strong">{i18n.translate("documents")}</s-text>
        <s-checkbox
          name="Invoice"
          checked={printInvoice}
          onChange={(event) => {
            setPrintInvoice(
              /** @type {HTMLInputElement} */ (event.target).checked,
            );
          }}
          label={i18n.translate("invoice")}
        />
        <s-checkbox
          name="Packing Slips"
          checked={printPackingSlip}
          onChange={(event) => {
            setPrintPackingSlip(
              /** @type {HTMLInputElement} */ (event.target).checked,
            );
          }}
          label={i18n.translate("packingSlip")}
        />
      </s-stack>
    </s-admin-print-action>
  );
}
