import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";
import {fetchSellingPlans} from "./FetchSellingPlans.js";

export default function extension() {
  render(<Action />, document.body);
}

function Action() {
  const [response, setResponse] = useState(undefined);

  useEffect(() => {
    async function getSellingPlans() {
      setResponse(await fetchSellingPlans(shopify.cartLineItem?.variantId));
    }

    getSellingPlans();
  }, []);

  /** @param {{ id: string; name: string; category?: string }} plan */
  const handleClick = (plan) => {
    shopify.cart.addLineItemSellingPlan({
      lineItemUuid: shopify.cartLineItem.uuid,
      sellingPlanId: Number(plan.id.split("/").pop()),
      sellingPlanName: plan.name,
    });
    window.close();
  };

  return (
    <s-page heading="Subscriptions">
      <s-scroll-box>
        <s-box padding="small">
          {response?.data?.productVariant?.sellingPlanGroups?.nodes?.map(
            (group) => (
              <s-section key={`${group.name}-section`} heading={group.name}>
                {group.sellingPlans.nodes
                  .filter((plan) => plan.category === "SUBSCRIPTION")
                  .map((plan) => (
                    <s-clickable
                      key={`${plan.id}-clickable`}
                      onClick={() => handleClick(plan)}
                    >
                      <s-text>{plan.name}</s-text>
                    </s-clickable>
                  ))}
              </s-section>
            ),
          )}
        </s-box>
      </s-scroll-box>
    </s-page>
  );
}
