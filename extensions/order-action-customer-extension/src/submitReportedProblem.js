const API_VERSION = "2026-07";
const METAFIELD_KEY = "reportedProblem";

/**
 * @param {string} orderId
 */
function normalizeOrderId(orderId) {
  if (typeof orderId !== "string" || !orderId.trim()) {
    return orderId;
  }

  const orderIdentityMatch = orderId.match(
    /^gid:\/\/shopify\/OrderIdentity\/(\d+)$/,
  );

  if (orderIdentityMatch) {
    return `gid://shopify/Order/${orderIdentityMatch[1]}`;
  }

  if (/^\d+$/.test(orderId)) {
    return `gid://shopify/Order/${orderId}`;
  }

  return orderId;
}

/**
 * @param {string} orderId
 * @param {string} problemLabel
 */
export async function submitReportedProblem(orderId, problemLabel) {
  const ownerId = normalizeOrderId(orderId);

  const response = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `mutation setReportedProblem($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              value
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          metafields: [
            {
              ownerId,
              namespace: "$app",
              key: METAFIELD_KEY,
              type: "single_line_text_field",
              value: problemLabel,
            },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not save the reported problem.");
  }

  const { data, errors } = await response.json();
  const userError = data?.metafieldsSet?.userErrors?.[0]?.message;
  const graphQLError = errors?.[0]?.message;

  if (userError || graphQLError) {
    throw new Error(userError || graphQLError);
  }

  return data?.metafieldsSet?.metafields?.[0]?.value;
}
