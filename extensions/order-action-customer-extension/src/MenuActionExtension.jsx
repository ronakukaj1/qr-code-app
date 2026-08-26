/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import {render} from 'preact';

const API_VERSION = '2026-07';

export default async () => {
  const showAction = await orderHasFulfillments(shopify.orderId);
  render(<MenuActionExtension showAction={showAction} />, document.body);
};

/**
 * @param {string} orderId
 */
async function orderHasFulfillments(orderId) {
  try {
    const result = await fetch(
      `shopify:customer-account/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query Order($orderId: ID!) {
            order(id: $orderId) {
              fulfillmentStatus
              fulfillments(first: 1) {
                nodes {
                  latestShipmentStatus
                }
              }
            }
          }`,
          variables: {orderId},
        }),
      },
    );

    const {data, errors} = await result.json();

    if (errors?.length) {
      console.log(errors);
      return false;
    }

    const order = data?.order;
    if (!order) {
      return false;
    }

    const hasFulfillmentRecords = order.fulfillments?.nodes?.length > 0;
    const hasFulfillmentProgress =
      order.fulfillmentStatus && order.fulfillmentStatus !== 'UNFULFILLED';

    return hasFulfillmentRecords || hasFulfillmentProgress;
  } catch (error) {
    console.log(error);
    return false;
  }
}

/**
 * @param {{ showAction: boolean }} props
 */
function MenuActionExtension({showAction}) {
  if (!showAction) {
    return null;
  }

  return <s-button>Report a problem</s-button>;
}
