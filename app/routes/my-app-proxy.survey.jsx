import { authenticate, unauthenticated } from "../shopify.server";
import { saveSurveyAttribution } from "../survey.server";

export const action = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const body = await request.json().catch(() => ({}));
  const orderId = body.orderId;
  const attribution = body.attribution;

  if (!shop) {
    return Response.json({ ok: false, error: "Missing shop" }, { status: 400 });
  }

  if (!orderId || !attribution) {
    return Response.json(
      { ok: false, error: "Missing orderId or attribution" },
      { status: 400 },
    );
  }

  try {
    const { admin } = await unauthenticated.admin(shop);
    await saveSurveyAttribution(orderId, attribution, admin);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[survey] App proxy save failed:", error);
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save survey response",
      },
      { status: 500 },
    );
  }
};
