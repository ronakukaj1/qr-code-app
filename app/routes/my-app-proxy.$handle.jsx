import invariant from "tiny-invariant";

import { processQRCodeScan } from "../models/QRCode.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  invariant(params.handle, "Missing QR code handle");
  invariant(shop, "Missing shop parameter");

  return processQRCodeScan(shop, params.handle);
};
