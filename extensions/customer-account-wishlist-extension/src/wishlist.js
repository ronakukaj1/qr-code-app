const API_VERSION = "2026-07";
const METAFIELD_KEY = "wishlist";

const CUSTOMER_WISHLIST_QUERY = `query CustomerWishlist($namespace: String!, $key: String!) {
  customer {
    id
    wishlist: metafield(namespace: $namespace, key: $key) {
      jsonValue
    }
  }
}`;

const SAVE_WISHLIST_MUTATION = `mutation SaveWishlist($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      jsonValue
    }
    userErrors {
      field
      message
    }
  }
}`;

const PRODUCTS_BY_IDS_QUERY = `query WishlistProducts($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Product {
      id
      title
      onlineStoreUrl
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        url
      }
    }
  }
}`;

/**
 * @returns {Promise<string[]>}
 */
export async function getWishlistProductIds() {
  const response = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: CUSTOMER_WISHLIST_QUERY,
        variables: {
          namespace: "$app",
          key: METAFIELD_KEY,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not load your wishlist.");
  }

  const { data, errors } = await response.json();

  if (errors?.length) {
    throw new Error(errors[0]?.message ?? "Could not load your wishlist.");
  }

  const value = data?.customer?.wishlist?.jsonValue;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((id) => typeof id === "string" && id.length > 0);
}

/**
 * @param {string} customerId
 * @param {string[]} productIds
 */
export async function saveWishlistProductIds(customerId, productIds) {
  const response = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: SAVE_WISHLIST_MUTATION,
        variables: {
          metafields: [
            {
              ownerId: customerId,
              namespace: "$app",
              key: METAFIELD_KEY,
              type: "json",
              value: JSON.stringify(productIds),
            },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not update your wishlist.");
  }

  const { data, errors } = await response.json();
  const userError = data?.metafieldsSet?.userErrors?.[0]?.message;
  const graphQLError = errors?.[0]?.message;

  if (userError || graphQLError) {
    throw new Error(userError || graphQLError);
  }
}

/**
 * @param {string[]} productIds
 */
export async function fetchWishlistProducts(productIds) {
  if (productIds.length === 0) {
    return [];
  }

  const data = await shopify.query(PRODUCTS_BY_IDS_QUERY, {
    variables: { ids: productIds },
  });

  const nodes = data.data?.nodes ?? [];

  return nodes.filter(Boolean);
}

/**
 * @returns {Promise<{ customerId: string, products: any[] }>}
 */
export async function loadWishlist() {
  const customerResponse = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: CUSTOMER_WISHLIST_QUERY,
        variables: {
          namespace: "$app",
          key: METAFIELD_KEY,
        },
      }),
    },
  );

  if (!customerResponse.ok) {
    throw new Error("Could not load your wishlist.");
  }

  const customerPayload = await customerResponse.json();
  const customerId = customerPayload?.data?.customer?.id;
  const productIds = await getWishlistProductIdsFromPayload(customerPayload);

  if (!customerId) {
    throw new Error("Customer is not available.");
  }

  const products = await fetchWishlistProducts(productIds);

  return { customerId, products };
}

/**
 * @param {any} payload
 * @returns {string[]}
 */
function getWishlistProductIdsFromPayload(payload) {
  if (payload?.errors?.length) {
    throw new Error(
      payload.errors[0]?.message ?? "Could not load your wishlist.",
    );
  }

  const value = payload?.data?.customer?.wishlist?.jsonValue;

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((id) => typeof id === "string" && id.length > 0);
}

/**
 * @param {string} customerId
 * @param {string[]} productIds
 * @param {string} productId
 */
export async function removeWishlistProduct(customerId, productIds, productId) {
  const nextProductIds = productIds.filter((id) => id !== productId);
  await saveWishlistProductIds(customerId, nextProductIds);
  return nextProductIds;
}
