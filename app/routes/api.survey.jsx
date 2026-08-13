import { authenticate, unauthenticated } from "../shopify.server";
import { resolveShopDomain } from "../post-purchase.server";
import { saveSurveyAttribution } from "../survey.server";

async function authenticateSurveyRequest(request) {
  const checkoutAuth = await authenticate.public
    .checkout(request)
    .catch(() => null);

  if (checkoutAuth) {
    return checkoutAuth;
  }

  return authenticate.public.customerAccount(request);
}

export const loader = async ({ request }) => {
  const { cors } = await authenticateSurveyRequest(request);
  return cors();
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticateSurveyRequest(request);
  const body = await request.json().catch(() => ({}));
  const { orderId, attribution } = body;

  if (!orderId || !attribution) {
    return cors(
      Response.json(
        { ok: false, error: "Missing orderId or attribution" },
        { status: 400 },
      ),
    );
  }

  try {
    const shop = resolveShopDomain(sessionToken, body);
    const { admin } = await unauthenticated.admin(shop);
    await saveSurveyAttribution(orderId, attribution, admin);

    return cors(Response.json({ ok: true }));
  } catch (error) {
    console.error("[survey] Failed to save attribution:", error);
    return cors(
      Response.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to save survey response",
        },
        { status: 500 },
      ),
    );
  }
};
