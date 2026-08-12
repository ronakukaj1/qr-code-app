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
