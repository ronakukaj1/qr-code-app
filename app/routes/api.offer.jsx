import { authenticate, unauthenticated } from "../shopify.server";
import { cacheOffers, getOffers } from "../offer.server";
import { resolveShopDomain } from "../post-purchase.server";

export const loader = async ({ request }) => {
  const { cors } = await authenticate.public.checkout(request);
  return cors();
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);
  const body = await request.json().catch(() => ({}));

  const purchasedVariantIds =
    body.purchasedVariantIds ??
    body.initialPurchase?.lineItems?.map((line) => line.product?.variant?.id) ??
    [];

  let offers = [];

  try {
    const shop = resolveShopDomain(sessionToken, body);
    const { admin } = await unauthenticated.admin(shop);
    offers = await getOffers(admin, { purchasedVariantIds });
    cacheOffers(body.referenceId, offers);
    console.log(
      `[post-purchase] /api/offer for ${shop} → ${offers.length} offer(s)`,
    );
    if (offers[0]) {
      console.log(
        `[post-purchase] First offer image: ${offers[0].productTitle} → ${offers[0].productImageURL ?? "none"}`,
      );
    }
  } catch (error) {
    console.error("[post-purchase] Failed to load offers:", error);
  }

  return cors(Response.json({ offers }));
};
