/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";

export default function () {
  render(<PromotionBanner />, document.body);
}

function PromotionBanner() {
  return (
    <s-banner tone="success">
      <s-stack direction="block" inline-alignment="center">
        <s-text>
          🎉 You've earned 1,000 points from this order. You've been upgraded to
          Platinum tier. <s-link>View rewards</s-link>
        </s-text>
      </s-stack>
    </s-banner>
  );
}
