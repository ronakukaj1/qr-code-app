/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/preact";
import { render } from "preact";

export default function () {
  render(<Extension />, document.body);
}

/**
 * @param {unknown} value
 * @returns {'info' | 'success' | 'warning' | 'critical'}
 */
function resolveTone(value) {
  if (
    value === "success" ||
    value === "warning" ||
    value === "critical"
  ) {
    return value;
  }

  return "info";
}

function Extension() {
  const {
    heading: merchantHeading,
    description,
    collapsible,
    tone: merchantTone,
  } = shopify.settings.value;

  const heading =
    typeof merchantHeading === "string" && merchantHeading.trim()
      ? merchantHeading
      : "Custom Banner";
  const tone = resolveTone(merchantTone);
  const collapsibleValue =
    typeof collapsible === "boolean" ? collapsible : undefined;
  const descriptionText =
    typeof description === "string" && description.trim()
      ? description
      : "Edit this banner in Settings → Checkout → Customize checkout → App block settings.";

  return (
    <s-banner heading={heading} tone={tone} collapsible={collapsibleValue}>
      {descriptionText}
    </s-banner>
  );
}
