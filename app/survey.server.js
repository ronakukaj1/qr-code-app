const SURVEY_METAFIELD_KEY = "surveyAttribution";

const ATTRIBUTION_LABELS = {
  tv: "TV",
  podcast: "Podcast",
  family: "From a friend or family member",
  tiktok: "Tiktok",
};

export function getSurveyAttributionLabel(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return ATTRIBUTION_LABELS[value] ?? value;
}

/** Thank-you page sends OrderIdentity; metafieldsSet requires Order ownerId. */
export function normalizeOrderId(orderId) {
  if (typeof orderId !== "string" || !orderId.trim()) {
    return orderId;
  }

  const orderIdentityMatch = orderId.match(
    /^gid:\/\/shopify\/OrderIdentity\/(\d+)$/,
  );

  if (orderIdentityMatch) {
    return `gid://shopify/Order/${orderIdentityMatch[1]}`;
  }

  if (/^\d+$/.test(orderId)) {
    return `gid://shopify/Order/${orderId}`;
  }

  return orderId;
}

export async function saveSurveyAttribution(orderId, attribution, admin) {
  const ownerId = normalizeOrderId(orderId);
  const response = await admin.graphql(
    `#graphql
      mutation SetSurveyAttribution($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: "$app",
            key: SURVEY_METAFIELD_KEY,
            type: "single_line_text_field",
            value: getSurveyAttributionLabel(attribution) ?? attribution,
          },
        ],
      },
    },
  );

  const { data } = await response.json();
  const userErrors = data?.metafieldsSet?.userErrors ?? [];

  if (userErrors.length) {
    throw new Error(userErrors[0].message);
  }

  return data?.metafieldsSet?.metafields?.[0];
}
