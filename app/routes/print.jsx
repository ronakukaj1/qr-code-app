import { authenticate } from "../shopify.server";
import {
  buildOrderPrintHtml,
  buildPrintHtml,
  fetchOrderForPrint,
} from "../print.server";

export const loader = async ({ request }) => {
  const { cors, admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const printType = url.searchParams.get("printType");
  const printTypes =
    url.searchParams.get("printTypes")?.split(",").filter(Boolean) || [];

  let print;

  if (orderId && printType) {
    const docTypes = printType.split(",").filter(Boolean);
    const order = await fetchOrderForPrint(admin, orderId);
    print = buildOrderPrintHtml(docTypes, order);
  } else {
    print = buildPrintHtml(printTypes);
  }

  return cors(
    new Response(print, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }),
  );
};
