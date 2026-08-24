export async function fetchSellingPlans(variantId) {
  if (!variantId) {
    return undefined;
  }

  const requestBody = {
    query: `#graphql
        query GetSellingPlans($variantId: ID!) {
          productVariant(id: $variantId) {
            sellingPlanGroups(first: 10) {
              nodes {
                name
                sellingPlans(first: 10) {
                  nodes {
                    id
                    name
                    category
                  }
                }
              }
            }
          }
        }
      `,
    variables: {variantId: `gid://shopify/ProductVariant/${variantId}`},
  };

  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  return res.json();
}
