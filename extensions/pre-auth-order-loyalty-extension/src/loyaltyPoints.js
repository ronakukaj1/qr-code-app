const API_VERSION = "2026-07";
const METAFIELD_NAMESPACE = "$app";
const CUSTOMER_POINTS_KEY = "points";
const ORDER_AWARDED_KEY = "loyaltyPointsAwarded";

const LOYALTY_STATUS_QUERY = `query LoyaltyStatus($orderId: ID!, $namespace: String!, $awardedKey: String!, $pointsKey: String!) {
  order(id: $orderId) {
    id
    loyaltyPointsAwarded: metafield(namespace: $namespace, key: $awardedKey) {
      value
    }
  }
  customer {
    id
    points: metafield(namespace: $namespace, key: $pointsKey) {
      value
    }
  }
}`;

const SAVE_METAFIELDS_MUTATION = `mutation SaveLoyaltyMetafields($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      value
    }
    userErrors {
      field
      message
    }
  }
}`;

/**
 * @param {string} amount
 */
export function pointsFromOrderTotal(amount) {
  const parsed = Number.parseFloat(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed);
}

/**
 * @param {string} query
 * @param {Record<string, unknown>} variables
 */
async function customerAccountGraphql(query, variables) {
  const response = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not reach the Customer Account API.");
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Customer Account API error.");
  }

  return payload;
}

/**
 * @param {string} orderId
 * @param {number} pointsEarned
 */
export async function creditLoyaltyPointsForOrder(orderId, pointsEarned) {
  if (!orderId || pointsEarned <= 0) {
    return { credited: false, pointsEarned };
  }

  const { data } = await customerAccountGraphql(LOYALTY_STATUS_QUERY, {
    orderId,
    namespace: METAFIELD_NAMESPACE,
    awardedKey: ORDER_AWARDED_KEY,
    pointsKey: CUSTOMER_POINTS_KEY,
  });

  const customerId = data?.customer?.id;
  const alreadyAwarded = Number.parseInt(
    data?.order?.loyaltyPointsAwarded?.value ?? "0",
    10,
  );

  if (!customerId) {
    throw new Error("Customer is not available.");
  }

  if (alreadyAwarded > 0) {
    return { credited: false, pointsEarned: alreadyAwarded };
  }

  const currentPoints = Number.parseInt(data.customer.points?.value ?? "0", 10);
  const nextPoints = currentPoints + pointsEarned;

  const savePayload = await customerAccountGraphql(SAVE_METAFIELDS_MUTATION, {
    metafields: [
      {
        ownerId: customerId,
        namespace: METAFIELD_NAMESPACE,
        key: CUSTOMER_POINTS_KEY,
        type: "number_integer",
        value: String(nextPoints),
      },
      {
        ownerId: orderId,
        namespace: METAFIELD_NAMESPACE,
        key: ORDER_AWARDED_KEY,
        type: "number_integer",
        value: String(pointsEarned),
      },
    ],
  });

  const userError = savePayload.data?.metafieldsSet?.userErrors?.[0]?.message;

  if (userError) {
    throw new Error(userError);
  }

  return { credited: true, pointsEarned };
}
