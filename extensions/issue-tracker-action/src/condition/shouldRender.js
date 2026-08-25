import { getVariantsCount } from "../utils.js";

export default async function extension() {
  const { data } = shopify;
  const productId = data.selected[0]?.id;

  if (!productId) {
    return { display: false };
  }

  const variantCount = await getVariantsCount(productId);

  return { display: variantCount > 1 };
}
