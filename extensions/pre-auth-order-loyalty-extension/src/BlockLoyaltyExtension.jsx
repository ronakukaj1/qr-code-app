/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import {
  useAuthenticationState,
  useOrder,
  useTotalAmount,
} from "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  creditLoyaltyPointsForOrder,
  pointsFromOrderTotal,
} from "./loyaltyPoints.js";

export default async () => {
  render(<BlockLoyaltyExtension />, document.body);
};

function BlockLoyaltyExtension() {
  const authenticationState = useAuthenticationState();
  const order = useOrder();
  const totalAmount = useTotalAmount();
  const pointsEarned = pointsFromOrderTotal(totalAmount.amount);
  const [displayPoints, setDisplayPoints] = useState(pointsEarned);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    setDisplayPoints(pointsEarned);
  }, [pointsEarned]);

  useEffect(() => {
    if (authenticationState !== "fully_authenticated") {
      return;
    }

    const orderId = order?.id;

    if (!orderId || pointsEarned <= 0) {
      return;
    }

    creditLoyaltyPointsForOrder(orderId, pointsEarned)
      .then((result) => {
        setDisplayPoints(result.pointsEarned);
      })
      .catch((creditError) => {
        setError(
          creditError instanceof Error
            ? creditError.message
            : "Could not update loyalty points.",
        );
      });
  }, [authenticationState, order?.id, pointsEarned]);

  async function viewPoints() {
    await shopify.requireLogin();
  }

  const formattedPoints = shopify.i18n.formatNumber(displayPoints, {
    maximumFractionDigits: 0,
  });

  return (
    <s-section>
      {error ? <s-banner tone="critical">{error}</s-banner> : null}
      <s-stack direction="inline" inline-alignment="center" gap="small-500">
        <s-text>Points earned from your purchase: </s-text>
        {authenticationState === "pre_authenticated" ? (
          <s-link onClick={viewPoints} tone="neutral">
            View rewards
          </s-link>
        ) : (
          <s-text>{formattedPoints}</s-text>
        )}
      </s-stack>
    </s-section>
  );
}
