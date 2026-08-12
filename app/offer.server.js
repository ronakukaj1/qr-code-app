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

function getProductImageUrl(product, variant) {
  const mediaNodes = product.media?.nodes ?? [];

  for (const node of mediaNodes) {
    const url = pickUrl(node.image?.url, node.preview?.image?.url);
    if (url) return url;
  }

  return pickUrl(
    variant.image?.url,
    product.images?.nodes?.[0]?.url,
    product.featuredMedia?.preview?.image?.url,
    product.featuredImage?.url,
  );
}

function buildOffer(product, variant, index) {
  const variantId = Number(variant.legacyResourceId);
  const productImageURL = getProductImageUrl(product, variant);

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
    purchasedVariantIds.map((id) => Number(id)).filter(Boolean),
  );

  const response = await admin.graphql(
    `#graphql
      query PostPurchaseOfferProducts {
        products(first: 20, sortKey: TITLE) {
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
            images(first: 1) {
              nodes {
                url
              }
            }
            media(first: 3) {
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

  const result = await response.json();

  if (result.errors?.length) {
    console.error("Post-purchase product query failed:", result.errors);
    return [];
  }

  const offers = [];

  for (const product of result.data?.products?.nodes ?? []) {
    if (/gift card/i.test(product.title)) {
      continue;
    }

    for (const variant of product.variants?.nodes ?? []) {
      const variantId = Number(variant.legacyResourceId);

      if (!variantId || purchasedIds.has(variantId)) {
        continue;
      }

      const offer = buildOffer(product, variant, offers.length);

      if (!offer.productImageURL) {
        console.warn(
          `[post-purchase] Skipping offer without image: ${product.title}`,
        );
        continue;
      }

      offers.push(offer);

      if (offers.length >= 3) {
        return offers;
      }
    }
  }

  return offers;
}

export function getSelectedOffer(offerId, offers = []) {
  return offers.find((offer) => offer.id === Number(offerId));
}
