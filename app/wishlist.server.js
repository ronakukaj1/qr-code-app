const WISHLIST_METAFIELD_KEY = "wishlist";

/**
 * @param {string | number | null | undefined} id
 */
export function normalizeCustomerId(id) {
  if (id == null || id === "") {
    return id;
  }

  const value = String(id);

  if (value.startsWith("gid://shopify/Customer/")) {
    return value;
  }

  return `gid://shopify/Customer/${value}`;
}

/**
 * @param {string | number | null | undefined} id
 */
export function normalizeProductId(id) {
  if (id == null || id === "") {
    return id;
  }

  const value = String(id);

  if (value.startsWith("gid://shopify/Product/")) {
    return value;
  }

  return `gid://shopify/Product/${value}`;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function parseWishlistValue(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => typeof entry === "string" && entry.length > 0)
    .map((entry) => normalizeProductId(entry));
}

/**
 * @param {string} customerId
 * @param {object} admin
 */
export async function getWishlistProductIds(customerId, admin) {
  const ownerId = normalizeCustomerId(customerId);

  const response = await admin.graphql(
    `#graphql
      query CustomerWishlist($id: ID!) {
        customer(id: $id) {
          wishlist: metafield(namespace: "$app", key: "${WISHLIST_METAFIELD_KEY}") {
            jsonValue
          }
        }
      }
    `,
    {
      variables: { id: ownerId },
    },
  );

  const payload = await response.json();

  if (!payload?.data?.customer) {
    throw new Error("Customer not found.");
  }

  return parseWishlistValue(payload.data.customer.wishlist?.jsonValue);
}

/**
 * @param {string} customerId
 * @param {string[]} productIds
 * @param {object} admin
 */
export async function saveWishlistProductIds(customerId, productIds, admin) {
  const ownerId = normalizeCustomerId(customerId);
  const uniqueProductIds = [...new Set(productIds.map(normalizeProductId))];

  const response = await admin.graphql(
    `#graphql
      mutation SaveWishlist($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            jsonValue
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: "$app",
            key: WISHLIST_METAFIELD_KEY,
            type: "json",
            value: JSON.stringify(uniqueProductIds),
          },
        ],
      },
    },
  );

  const payload = await response.json();
  const userError = payload?.data?.metafieldsSet?.userErrors?.[0]?.message;
  const graphQLError = payload?.errors?.[0]?.message;

  if (userError || graphQLError) {
    throw new Error(userError || graphQLError);
  }

  return parseWishlistValue(
    payload.data.metafieldsSet.metafields?.[0]?.jsonValue,
  );
}

/**
 * @param {string} customerId
 * @param {string} productId
 * @param {object} admin
 */
export async function addProductToWishlist(customerId, productId, admin) {
  const normalizedProductId = normalizeProductId(productId);
  const productIds = await getWishlistProductIds(customerId, admin);

  if (productIds.includes(normalizedProductId)) {
    return productIds;
  }

  return saveWishlistProductIds(
    customerId,
    [...productIds, normalizedProductId],
    admin,
  );
}

/**
 * @param {string} customerId
 * @param {string} productId
 * @param {object} admin
 */
export async function isProductInWishlist(customerId, productId, admin) {
  const productIds = await getWishlistProductIds(customerId, admin);
  return productIds.includes(normalizeProductId(productId));
}
