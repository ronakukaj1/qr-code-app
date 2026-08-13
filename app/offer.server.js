import { parseVariantId } from "./post-purchase.server";

/** @type {Map<string, object[]>} */
const offerCache = new Map();

function pickUrl(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate;
    }
  }

  return null;
}

function isPlaceholderImageUrl(url) {
  if (!url) {
    return true;
  }

  return /placeholder-images|no-image|default_product|placeholder\.svg/i.test(url);
}

function getProductImageUrl(product, variant) {
  const mediaNodes = product.media?.nodes ?? [];

  for (const node of mediaNodes) {
    const url = pickUrl(node.image?.url, node.preview?.image?.url);
    if (url && !isPlaceholderImageUrl(url)) {
      return url;
    }
  }

  return pickUrl(
    variant.image?.url,
    product.images?.nodes?.[0]?.url,
    product.featuredMedia?.preview?.image?.url,
    product.featuredImage?.url,
  );
}

function buildOffer(product, variant, index, productImageURL) {
  const variantId = parseVariantId(variant.legacyResourceId);

  if (variantId == null || !productImageURL) {
    return null;
  }

  return {
    id: index + 1,
    title: "One time offer",
    productTitle: product.title,
    productImageURL,
    productDescription: [`Add ${product.title} to your order at 15% off.`],
    originalPrice: variant.price,
    discountedPrice: variant.price,
    variantId,
    changes: [
      {
        type: "add_variant",
        variantID: variantId,
        quantity: 1,
        discount: {
          value: 15,
          valueType: "percentage",
          title: "15% off",
        },
      },
    ],
  };
}

function collectOfferCandidates(products, purchasedIds) {
  /** @type {{ product: any; variant: any; imageUrl: string; hasRealImage: boolean }[]} */
  const candidates = [];

  for (const product of products) {
    if (/gift card/i.test(product.title)) {
      continue;
    }

    for (const variant of product.variants?.nodes ?? []) {
      const variantId = parseVariantId(variant.legacyResourceId);

      if (variantId == null || purchasedIds.has(variantId)) {
        continue;
      }

      const imageUrl = getProductImageUrl(product, variant);

      if (!imageUrl) {
        continue;
      }

      candidates.push({
        product,
        variant,
        imageUrl,
        hasRealImage: !isPlaceholderImageUrl(imageUrl),
      });
    }
  }

  return candidates;
}

function selectOfferCandidates(candidates) {
  const withRealImages = candidates.filter((candidate) => candidate.hasRealImage);
  const pool = withRealImages.length > 0 ? withRealImages : candidates;

  return pool.slice(0, 3);
}

export function cacheOffers(referenceId, offers) {
  if (referenceId) {
    offerCache.set(referenceId, offers);
  }
}

export function getCachedOffers(referenceId) {
  return referenceId ? offerCache.get(referenceId) : undefined;
}

export async function getOffers(admin, { purchasedVariantIds = [] } = {}) {
  if (!admin) {
    return [];
  }

  const purchasedIds = new Set(
    purchasedVariantIds
      .map((id) => parseVariantId(id))
      .filter((id) => id != null),
  );

  let response;

  try {
    response = await admin.graphql(
      `#graphql
        query PostPurchaseOfferProducts {
          products(first: 50, sortKey: TITLE, query: "status:active") {
            nodes {
              title
              featuredImage {
                url
              }
              featuredMedia {
                preview {
                  image {
                    url
                  }
                }
              }
              images(first: 5) {
                nodes {
                  url
                }
              }
              media(first: 5) {
                nodes {
                  preview {
                    image {
                      url
                    }
                  }
                  ... on MediaImage {
                    image {
                      url
                    }
                  }
                }
              }
              variants(first: 5) {
                nodes {
                  legacyResourceId
                  price
                  image {
                    url
                  }
                }
              }
            }
          }
        }`,
    );
  } catch (error) {
    console.error(
      "[post-purchase] Product query failed:",
      error?.graphQLErrors ?? error?.message ?? error,
    );
    return [];
  }

  const result = await response.json();

  if (result.errors?.length) {
    console.error("Post-purchase product query failed:", result.errors);
    return [];
  }

  const products = result.data?.products?.nodes ?? [];
  const candidates = collectOfferCandidates(products, purchasedIds);
  const selected = selectOfferCandidates(candidates);

  if (selected.length === 0) {
    console.warn(
      `[post-purchase] No offer candidates from ${products.length} product(s)`,
    );
    return [];
  }

  const offers = selected
    .map((candidate, index) =>
      buildOffer(
        candidate.product,
        candidate.variant,
        index,
        candidate.imageUrl,
      ),
    )
    .filter((offer) => offer != null);

  console.log(
    `[post-purchase] Selected ${offers.length} offer(s); first: ${offers[0]?.productTitle ?? "none"}`,
  );

  return offers;
}

export function getSelectedOffer(offerId, offers = []) {
  return offers.find((offer) => offer.id === Number(offerId));
}
