/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";

export default function () {
  render(<CustomerFulfillmentDetailsDelivery />, document.body);
}

function CustomerFulfillmentDetailsDelivery() {
  return (
    <s-stack direction="block" gap="base">
      <s-divider />
      <s-text>Tell us how we did for a chance to win 1000 points</s-text>
      <s-stack direction="block" max-inline-size="150">
        <s-button>Write a review</s-button>
      </s-stack>
    </s-stack>
  );
}
