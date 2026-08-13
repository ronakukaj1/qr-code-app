/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

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
  const [draftValue, setDraftValue] = useState(savedValue);
  const saveTimeoutRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  useEffect(() => {
    setDraftValue(savedValue);
    setChecked(Boolean(savedValue));
  }, [savedValue]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!instructions.value.metafields.canSetCartMetafields) {
    return null;
  }

  // Only render once for one-time purchase shipping (not subscription duplicate).
  if (!deliveryGroupList || deliveryGroupList.groupType !== "oneTimePurchase") {
    return null;
  }

  async function persistInstructions(value) {
    const result = await applyMetafieldChange({
      type: "updateCartMetafield",
      metafield: {
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        type: "multi_line_text_field",
        value,
      },
    });

    if (result.type === "error") {
      console.error("[delivery-instructions]", result.message);
    }
  }

  function scheduleSave(value) {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void persistInstructions(value);
    }, 400);
  }

  return (
    <s-stack gap="base">
      <s-checkbox
        checked={checked}
        onChange={() => {
          const nextChecked = !checked;
          setChecked(nextChecked);

          if (!nextChecked) {
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = null;
            }

            setDraftValue("");
            void persistInstructions("");
          }
        }}
        label={translate("deliveryInstructionsCheckbox")}
      />
      {checked && (
        <s-text-area
          label={translate("deliveryInstructions")}
          rows={3}
          value={draftValue}
          onInput={(event) => {
            const value =
              /** @type {HTMLTextAreaElement} */ (event.currentTarget).value ??
              "";

            setDraftValue(value);
            scheduleSave(value);
          }}
          onBlur={(event) => {
            if (saveTimeoutRef.current) {
              clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = null;
            }

            const value =
              /** @type {HTMLTextAreaElement} */ (event.currentTarget).value ??
              "";

            void persistInstructions(value);
          }}
        />
      )}
    </s-stack>
  );
}
