const API_VERSION = "2026-07";
const METAFIELD_NAMESPACE = "$app";
const METAFIELD_KEY = "points";

/**
 * @returns {Promise<number>}
 */
export async function getLoyaltyPoints() {
  const response = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query loyaltyPoints($namespace: String!, $key: String!) {
          customer {
            metafield(namespace: $namespace, key: $key) {
              value
            }
          }
        }`,
        variables: {
          namespace: METAFIELD_NAMESPACE,
          key: METAFIELD_KEY,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not load loyalty points.");
  }

  const { data, errors } = await response.json();

  if (errors?.length) {
    throw new Error(errors[0]?.message ?? "Could not load loyalty points.");
  }

  const value = data?.customer?.metafield?.value;
  return value ? Number.parseInt(value, 10) : 0;
}
