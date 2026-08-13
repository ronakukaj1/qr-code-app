const PLACEHOLDER_PRODUCT_IMAGE =
  "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";

/**
 * Post-purchase JWTs use `iss: "shopify"` and `sub: referenceId` — not `dest`.
 * The shop domain must come from the extension request body.
 */
export function resolveShopDomain(sessionToken, body = {}) {
  const shopFromBody = body.shop ?? body.shopDomain;

  if (typeof shopFromBody === "string" && shopFromBody.length > 0) {
    return shopFromBody.replace(/^https:\/\//, "").replace(/\/$/, "");
  }

  if (typeof sessionToken?.dest === "string") {
    return sessionToken.dest.replace(/^https:\/\//, "").replace(/\/$/, "");
  }

  throw new Error("Missing shop domain in post-purchase request.");
}

/** @param {unknown} id */
export function parseVariantId(id) {
  if (id == null) {
    return null;
  }

  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }

  const value = String(id);
  const gidMatch = value.match(/ProductVariant\/(\d+)/);

  if (gidMatch) {
    return Number(gidMatch[1]);
  }

  const numericId = Number(value);
  return Number.isFinite(numericId) ? numericId : null;
}

export function getPlaceholderProductImageUrl() {
  return PLACEHOLDER_PRODUCT_IMAGE;
}

export function normalizePurchasedVariantIds(body = {}) {
  const rawIds =
    body.purchasedVariantIds ??
    body.initialPurchase?.lineItems?.map(
      (line) => line.product?.variant?.id,
    ) ??
    [];

  return rawIds.map((id) => parseVariantId(id)).filter((id) => id != null);
}
