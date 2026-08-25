import { productIdsMatch } from "./productId.js";

const METAOBJECT_TYPE = "$app:qrcode";

/** @param {{ jsonValue?: unknown; reference?: { id?: unknown } } | null | undefined} productField */
function getStoredProductId(productField) {
  if (!productField) {
    return null;
  }

  return productField.jsonValue ?? productField.reference?.id ?? null;
}

/** @typedef {{ id: string; jsonValue?: unknown; reference?: { id?: unknown; title?: string; legacyResourceId?: string } }} MetaobjectField */

/** @typedef {{ id: string; handle?: string; title?: MetaobjectField; product?: MetaobjectField; productVariant?: MetaobjectField; destination?: MetaobjectField; scans?: MetaobjectField }} MetaobjectNode */

/** @param {MetaobjectNode} metaobject @param {string} handle */
function mapMetaobject(metaobject, handle) {
  const variantLegacyId =
    metaobject.productVariant?.reference?.legacyResourceId;

  if (!variantLegacyId) {
    return null;
  }

  return {
    id: String(metaobject.id),
    handle,
    title: String(metaobject.title?.jsonValue ?? handle),
    productTitle: String(
      metaobject.product?.reference?.title ??
        metaobject.title?.jsonValue ??
        handle,
    ),
    variantLegacyId: Number(variantLegacyId),
    destination: String(metaobject.destination?.jsonValue ?? ""),
    scans: Number(metaobject.scans?.jsonValue ?? 0),
  };
}

/**
 * @param {string} handle
 */
export async function fetchQRCodeByHandle(handle) {
  const requestBody = {
    query: `#graphql
      query GetQRCodeForScan($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
          title: field(key: "title") { jsonValue }
          product: field(key: "product") {
            reference {
              ... on Product {
                title
                handle
              }
            }
          }
          productVariant: field(key: "product_variant") {
            reference {
              ... on ProductVariant {
                id
                legacyResourceId
              }
            }
          }
          destination: field(key: "destination") { jsonValue }
          scans: field(key: "scan_count") { jsonValue }
        }
      }
    `,
    variables: {
      handle: { type: METAOBJECT_TYPE, handle },
    },
  };

  const response = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }

  const metaobject = payload.data?.metaobjectByHandle;

  if (!metaobject) {
    return null;
  }

  return mapMetaobject(metaobject, handle);
}

/**
 * @param {number | string} productId
 */
export async function fetchQRCodeByProductId(productId) {
  const requestBody = {
    query: `#graphql
      query GetQRCodesForProduct($type: String!) {
        metaobjects(type: $type, first: 50, sortKey: "updated_at", reverse: true) {
          nodes {
            id
            handle
            title: field(key: "title") { jsonValue }
            product: field(key: "product") {
              jsonValue
              reference {
                ... on Product {
                  id
                  title
                  handle
                }
              }
            }
            productVariant: field(key: "product_variant") {
              reference {
                ... on ProductVariant {
                  id
                  legacyResourceId
                }
              }
            }
            destination: field(key: "destination") { jsonValue }
            scans: field(key: "scan_count") { jsonValue }
          }
        }
      }
    `,
    variables: {
      type: METAOBJECT_TYPE,
    },
  };

  const response = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }

  const metaobjects = payload.data?.metaobjects?.nodes ?? [];
  const metaobject = metaobjects.find((node) =>
    productIdsMatch(getStoredProductId(node.product), productId),
  );

  if (!metaobject) {
    return null;
  }

  return mapMetaobject(metaobject, metaobject.handle);
}

/**
 * @param {string} id
 * @param {number} currentScans
 */
export async function incrementQRCodeScans(id, currentScans) {
  const requestBody = {
    query: `#graphql
      mutation IncrementQRScans($id: ID!, $metaobject: MetaobjectUpdateInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject { id }
          userErrors { field message }
        }
      }
    `,
    variables: {
      id,
      metaobject: {
        fields: [{ key: "scan_count", value: String(currentScans + 1) }],
      },
    },
  };

  const response = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const payload = await response.json();
  const userErrors = payload.data?.metaobjectUpdate?.userErrors ?? [];

  if (userErrors.length) {
    throw new Error(userErrors[0].message);
  }
}
