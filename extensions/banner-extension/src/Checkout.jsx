/// <reference path="../shopify.d.ts" />
import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useState} from "preact/hooks";

// 1. Export the extension
export default function() {
  render(<Extension />, document.body)
}

function Extension() {
  const {
    applyMetafieldChange,
    appMetafields,
    i18n: {translate},
    target: {value: deliveryGroupList},
  } = shopify;
  const [checked, setChecked] = useState(false);

  // Define the metafield namespace and key
  const metafieldNamespace = "custom"
  const metafieldKey = "field";

  // Get a reference to the metafield
  const deliveryInstructions = appMetafields.value.find(
    (appMetafield) =>
      appMetafield.target.type === 'cart' &&
      appMetafield.metafield.namespace === metafieldNamespace &&
      appMetafield.metafield.key === metafieldKey,
  );

  // Guard against duplicate rendering of `shipping-option-list.render-after` target for one-time purchase and subscription sections. Calling `applyMetafieldsChange()` on the same namespace-key pair from duplicated extensions would otherwise cause an overwrite of the metafield value.
  // Instead of guarding, another approach would be to prefix the metafield key when calling `applyMetafieldsChange()`. The `deliveryGroupList`'s `groupType` could be used to such effect.'
  if (!deliveryGroupList || deliveryGroupList.groupType !== 'oneTimePurchase') {
    return null;
  }

  // Render UI components
  return (
    <s-stack gap="base">
      <s-checkbox
        checked={checked}
        onChange={handleChange}
        label={translate('deliveryInstructionsCheckbox')}
      />
      {checked && (
        <s-text-area
          label={translate('deliveryInstructions')}
          rows={3}
          onBlur={(event) => {
            const value =
              /** @type {HTMLTextAreaElement} */ (event.currentTarget).value ?? "";
            // Apply the change to the cart metafield
            applyMetafieldChange({
              type: "updateCartMetafield",
              metafield: {
                namespace: metafieldNamespace,
                key: metafieldKey,
                type: "multi_line_text_field",
                value,
              }
            })
          }}
          value={`${deliveryInstructions?.metafield?.value || ''}`}
        />
      )}
    </s-stack>
  );

  async function handleChange() {
    setChecked(!checked);
  }
}