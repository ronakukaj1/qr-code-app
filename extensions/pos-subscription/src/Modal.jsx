import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";
import {fetchSellingPlans} from "./FetchSellingPlans.js";

export default function extension() {
  render(<Modal />, document.body);
}

function Modal() {
  const sellingPlanItem = shopify.cart.current.value.lineItems.find(
    (lineItem) => lineItem.hasSellingPlanGroups === true,
  );

  const [response, setResponse] = useState(undefined);

  useEffect(() => {
    async function getSellingPlans() {
      setResponse(await fetchSellingPlans(sellingPlanItem?.variantId));
    }

    getSellingPlans();
  }, [sellingPlanItem]);

  /** @param {{ id: string; name: string; category?: string }} plan */
  const handleClick = (plan) => {
    if (!sellingPlanItem) {
      return;
    }

    shopify.cart.addLineItemSellingPlan({
      lineItemUuid: sellingPlanItem.uuid,
      sellingPlanId: Number(plan.id.split("/").pop()),
      sellingPlanName: plan.name,
    });
    window.close();
  };

  return (
    <s-page heading="POS subscription modal">
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
