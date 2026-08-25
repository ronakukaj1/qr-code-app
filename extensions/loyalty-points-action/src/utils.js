export async function updateLoyaltyPoints(segmentId, points) {
  const customerIds = await getCustomerIds(segmentId);

  return await makeGraphQLQuery(
    `mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      metafields: customerIds.map((customerId) => ({
        ownerId: customerId,
        namespace: "$app",
        key: "points",
        type: "number_integer",
        value: points.toString(),
      })),
    },
  );
}

export async function getCustomerIds(segmentId) {
  const response = await makeGraphQLQuery(
    `query SegmentMembers($id: ID!) {
      customerSegmentMembers(first: 10, segmentId: $id) {
        edges {
          node {
            id
          }
        }
      }
    }`,
    { id: segmentId },
  );

  return (
    response.data?.customerSegmentMembers?.edges?.map((edge) => edge.node.id) ??
    []
  );
}

async function makeGraphQLQuery(query, variables) {
  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error("Network error");
  }

  return await res.json();
}
