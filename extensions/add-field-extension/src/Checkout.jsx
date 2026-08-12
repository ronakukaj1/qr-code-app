/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";

const METAFIELD_NAMESPACE = "$app";
const METAFIELD_KEY = "deliveryInstructions";

export default function () {
  render(<Extension />, document.body);
}

function Extension() {
  const {
    applyMetafieldChange,
    appMetafields,
    i18n: { translate },
    instructions,
    target: { value: deliveryGroupList },
  } = shopify;

  const savedInstructions = appMetafields.value.find(
    (appMetafield) =>
      appMetafield.target.type === "cart" &&
      appMetafield.metafield.namespace === METAFIELD_NAMESPACE &&
      appMetafield.metafield.key === METAFIELD_KEY,
  );
  const savedValue =
    typeof savedInstructions?.metafield?.value === "string"
      ? savedInstructions.metafield.value
      : "";

  const [checked, setChecked] = useState(Boolean(savedValue));

  if (!instructions.value.metafields.canSetCartMetafields) {
    return null;
  }

  // Only render once for one-time purchase shipping (not subscription duplicate).
  if (!deliveryGroupList || deliveryGroupList.groupType !== "oneTimePurchase") {
    return null;
  }

  return (
    <s-stack gap="base">
      <s-checkbox
        checked={checked}
        onChange={() => setChecked(!checked)}
        label={translate("deliveryInstructionsCheckbox")}
      />
      {checked && (
        <s-text-area
          label={translate("deliveryInstructions")}
          rows={3}
          value={savedValue}
          onBlur={(event) => {
            const value =
              /** @type {HTMLTextAreaElement} */ (event.currentTarget).value ??
              "";

            applyMetafieldChange({
              type: "updateCartMetafield",
              metafield: {
                namespace: METAFIELD_NAMESPACE,
                key: METAFIELD_KEY,
                type: "multi_line_text_field",
                value,
              },
            });
          }}
        />
      )}
    </s-stack>
  );
}
