import { authenticate, unauthenticated } from "../shopify.server";
import {
  addProductToWishlist,
  getWishlistProductIds,
  isProductInWishlist,
} from "../wishlist.server";

function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

export const loader = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const customerId = url.searchParams.get("logged_in_customer_id");
  const productId = url.searchParams.get("product_id");

  if (!shop) {
    return jsonResponse({ ok: false, error: "Missing shop" }, 400);
  }

  if (!customerId) {
    return jsonResponse(
      { ok: false, error: "Log in to view your wishlist." },
      401,
    );
  }

  try {
    const { admin } = await unauthenticated.admin(shop);

    if (productId) {
      const inWishlist = await isProductInWishlist(customerId, productId, admin);
      return jsonResponse({ ok: true, inWishlist });
    }

    const productIds = await getWishlistProductIds(customerId, admin);
    return jsonResponse({ ok: true, productIds });
  } catch (error) {
    console.error("[wishlist] App proxy load failed:", error);
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Could not load wishlist.",
      },
      500,
    );
  }
};

export const action = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const customerId = url.searchParams.get("logged_in_customer_id");
  const body = await request.json().catch(() => ({}));
  const productId = body.product_id || url.searchParams.get("product_id");

  if (!shop) {
    return jsonResponse({ ok: false, error: "Missing shop" }, 400);
  }

  if (!customerId) {
    return jsonResponse(
      { ok: false, error: "Log in to add items to your wishlist." },
      401,
    );
  }

  if (!productId) {
    return jsonResponse({ ok: false, error: "Missing product_id" }, 400);
  }

  try {
    const { admin } = await unauthenticated.admin(shop);
    const productIds = await addProductToWishlist(
      customerId,
      String(productId),
      admin,
    );

    return jsonResponse({ ok: true, productIds });
  } catch (error) {
    console.error("[wishlist] App proxy save failed:", error);
    return jsonResponse(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not save to wishlist.",
      },
      500,
    );
  }
};
