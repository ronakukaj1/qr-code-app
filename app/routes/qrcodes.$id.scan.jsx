import invariant from "tiny-invariant";

import { processQRCodeScan } from "../models/QRCode.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  await authenticate.public.appProxy(request);

  invariant(params.id, "Could not find QR code destination");

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  invariant(shop, "Missing shop parameter");

  return processQRCodeScan(shop, params.id);
};
