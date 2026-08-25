const SURVEY_METAFIELD_KEY = "surveyAttribution";

const ATTRIBUTION_LABELS = {
  tv: "TV",
  podcast: "Podcast",
  family: "From a friend or family member",
  tiktok: "Tiktok",
};

const RETRYABLE_SAVE_ERRORS =
  /owner (does not exist|not found|is invalid|must exist)|could not be found|try again/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function getSaveFailureMessage(payload) {
  const userError = payload?.data?.metafieldsSet?.userErrors?.[0]?.message;
  if (userError) {
    return userError;
  }

  const graphQLError = payload?.errors?.[0]?.message;
  if (graphQLError) {
    return graphQLError;
  }

  return "Survey response could not be saved.";
}

function shouldRetrySave(message, attempt, maxAttempts) {
  return attempt < maxAttempts && RETRYABLE_SAVE_ERRORS.test(message);
}

export async function saveSurveyAttribution(
  orderId,
  attribution,
  admin,
  { maxAttempts = 6, delayMs = 1500 } = {},
) {
  const ownerId = normalizeOrderId(orderId);
  const value = getSurveyAttributionLabel(attribution) ?? attribution;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
              value,
            },
          ],
        },
      },
    );

    const payload = await response.json();
    const metafield = payload?.data?.metafieldsSet?.metafields?.[0];

    if (metafield) {
      return metafield;
    }

    const message = getSaveFailureMessage(payload);

    if (shouldRetrySave(message, attempt, maxAttempts)) {
      await sleep(delayMs);
      continue;
    }

    throw new Error(message);
  }

  throw new Error("Survey response could not be saved.");
}
