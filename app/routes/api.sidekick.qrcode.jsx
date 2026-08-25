import { authenticate } from "../shopify.server";
import { getQRCodes, getQRCode } from "../models/QRCode.server";

export const loader = async ({ request }) => {
  const { cors, admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const handle = url.searchParams.get("handle");

  if (handle) {
    const qrCode = await getQRCode(handle, admin.graphql, session.shop);
    if (!qrCode) {
      return cors(Response.json({ error: "Not found" }, { status: 404 }));
    }
    return cors(Response.json({ qrCode: slimQRCode(qrCode) }));
  }

  const query = url.searchParams.get("query")?.toLowerCase() ?? "";
  const first = Number(url.searchParams.get("first") ?? 10);

  let qrCodes = await getQRCodes(admin.graphql, session.shop);

  if (query) {
    qrCodes = qrCodes.filter(
      (qr) =>
        qr.title?.toLowerCase().includes(query) ||
        qr.productTitle?.toLowerCase().includes(query),
    );
  }

  return cors(
    Response.json({
      results: qrCodes.slice(0, first).map(slimQRCode),
    }),
  );
};

function slimQRCode(qr) {
  return {
    handle: qr.handle,
    title: qr.title,
    productTitle: qr.productTitle,
    scans: qr.scans,
    destination: qr.destination,
    createdAt: qr.createdAt,
  };
}