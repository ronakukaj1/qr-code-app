import { authenticate } from "../shopify.server";
import { buildPrintHtml } from "../print.server";

export const loader = async ({ request }) => {
  const { cors } = await authenticate.admin(request);

  const url = new URL(request.url);
  const printTypes = url.searchParams.get("printTypes")?.split(",").filter(Boolean) || [];
  const print = buildPrintHtml(printTypes);

  return cors(
    new Response(print, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }),
  );
};
