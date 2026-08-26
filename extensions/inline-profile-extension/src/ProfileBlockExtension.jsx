/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { getLoyaltyPoints } from "./getLoyaltyPoints.js";

export default function () {
  render(<ProfileBlockExtension />, document.body);
}

function ProfileBlockExtension() {
  const i18n = shopify.i18n;
  const [points, setPoints] = useState(/** @type {number | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    getLoyaltyPoints()
      .then(setPoints)
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load loyalty points.",
        );
      });
  }, []);

  const formattedPoints =
    points === null
      ? "—"
      : i18n.formatNumber(points, {
          maximumFractionDigits: 0,
        });

  return (
    <s-section heading="Rewards">
      <s-stack direction="block" gap="base" paddingBlockStart="base">
        {error ? (
          <s-banner tone="critical">{error}</s-banner>
        ) : null}
        <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="large">
          <s-stack direction="block" gap="small">
            <s-text color="subdued">Points</s-text>
            <s-text type="strong">{formattedPoints}</s-text>
          </s-stack>
          <s-stack direction="block" gap="small">
            <s-text color="subdued">Store credit</s-text>
            <s-text type="strong">
              {i18n.formatCurrency(450, { currency: "USD" })}
            </s-text>
          </s-stack>
          <s-stack direction="block" gap="small">
            <s-text color="subdued">Referrals</s-text>
            <s-text type="strong">3</s-text>
          </s-stack>
          <s-stack direction="block" gap="small">
            <s-text color="subdued">Referral bonus</s-text>
            <s-text type="strong">600</s-text>
          </s-stack>
        </s-grid>
        <s-stack direction="block" max-inline-size="140">
          <s-button tone="neutral" variant="secondary">
            View rewards
          </s-button>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
