import { getQRCodeByProductId } from "../models/QRCode.server";
import { authenticate, unauthenticated } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const productId = url.searchParams.get("product_id");
  const subpath = url.searchParams.get("subpath") || "qr-scan";

  if (!shop || !productId) {
    return Response.json(
      { ok: false, error: "Missing shop or product_id" },
      { status: 400 },
    );
  }

  const { admin } = await unauthenticated.admin(shop);
  const qrCode = await getQRCodeByProductId(productId, admin.graphql, shop);

  if (!qrCode) {
    return Response.json(
      { ok: false, error: "No QR code found for this product." },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    title: qrCode.title,
    image: qrCode.image,
    scanUrl: `https://${shop}/apps/${subpath}/${qrCode.handle}`,
    scans: qrCode.scans,
  });
};
