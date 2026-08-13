import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

import { authenticate, unauthenticated } from "../shopify.server";
import {
  getCachedOffers,
  getOffers,
  getSelectedOffer,
} from "../offer.server";
import { normalizePurchasedVariantIds, resolveShopDomain } from "../post-purchase.server";

export const loader = async ({ request }) => {
  const { cors } = await authenticate.public.checkout(request);
  return cors();
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  const body = await request.json();
  const purchasedVariantIds = normalizePurchasedVariantIds(body);

  let offers = getCachedOffers(body.referenceId);

  if (!offers?.length) {
    const shop = resolveShopDomain(sessionToken, body);
    const { admin } = await unauthenticated.admin(shop);
    offers = await getOffers(admin, { purchasedVariantIds });
  }

  const selectedOffer = getSelectedOffer(body.offerId ?? body.changes, offers);

  if (!selectedOffer) {
    console.error(
      `[post-purchase] No offer found for id ${body.offerId ?? body.changes}`,
    );
    return cors(
      Response.json({ error: "Offer not found" }, { status: 404 }),
    );
  }

  console.log(
    `[post-purchase] Signing changeset for variant ${selectedOffer.variantId} (${selectedOffer.productTitle})`,
  );

  const payload = {
    iss: process.env.SHOPIFY_API_KEY,
    jti: uuidv4(),
    iat: Date.now(),
    sub: body.referenceId,
    changes: selectedOffer.changes,
  };

  const token = jwt.sign(payload, process.env.SHOPIFY_API_SECRET);
  return cors(Response.json({ token }));
};
