import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { cors } = await authenticate.admin(request);

  const productIssues = [
    { title: "Too big", description: "The product was too big." },
    { title: "Too small", description: "The product was too small." },
    {
      title: "Just right",
      description:
        "The product was just right, but the customer is still unhappy.",
    },
  ];

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) {
    return cors(
      Response.json(
        { error: "Missing productId query parameter" },
        { status: 400 },
      ),
    );
  }

  const splitStr = productId.split("/");
  const idNumber = parseInt(splitStr[splitStr.length - 1], 10);
  const issue = productIssues[idNumber % productIssues.length];

  return cors(Response.json({ productIssue: issue }));
};
