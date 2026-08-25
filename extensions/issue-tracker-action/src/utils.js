/** @param {string} query @param {Record<string, unknown>} [variables] */
async function makeGraphQLQuery(query, variables) {
  const response = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error("Network error while loading product issues.");
  }

  return response.json();
}

/**
 * @param {string} productId
 * @returns {Promise<Array<{ id: number; title: string; description: string; completed: boolean }>>}
 */
export async function getIssues(productId) {
  const result = await makeGraphQLQuery(
    `#graphql
      query ProductIssues($id: ID!) {
        product(id: $id) {
          metafield(namespace: "$app", key: "issues") {
            value
          }
        }
      }
    `,
    { id: productId },
  );

  const value = result?.data?.product?.metafield?.value;

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const parsed = JSON.parse(value);

  return Array.isArray(parsed) ? parsed : [];
}

/**
 * @param {string} productId
 * @param {Array<{ id: number; title: string; description: string; completed: boolean }>} newIssues
 */
export async function updateIssues(productId, newIssues) {
  const result = await makeGraphQLQuery(
    `#graphql
      mutation SetProductIssues(
        $ownerId: ID!
        $namespace: String!
        $key: String!
        $type: String!
        $value: String!
      ) {
        metafieldsSet(
          metafields: [
            {
              ownerId: $ownerId
              namespace: $namespace
              key: $key
              type: $type
              value: $value
            }
          ]
        ) {
          metafields {
            id
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      ownerId: productId,
      namespace: "$app",
      key: "issues",
      type: "json",
      value: JSON.stringify(newIssues),
    },
  );

  const userErrors = result?.data?.metafieldsSet?.userErrors ?? [];

  if (userErrors.length) {
    throw new Error(userErrors[0].message);
  }

  if (result?.errors?.length) {
    throw new Error(result.errors[0].message);
  }

  return result;
}
