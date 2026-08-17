import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

const APP_METAFIELD_NAMESPACE = "$app";
const DELIVERY_INSTRUCTIONS_KEY = "deliveryInstructions";
const SURVEY_ATTRIBUTION_KEY = "surveyAttribution";

const SURVEY_LABELS = {
  tv: "TV",
  podcast: "Podcast",
  family: "From a friend or family member",
  tiktok: "Tiktok",
};

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { data, query, i18n } = shopify;
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    /** @type {string | null} */ (null),
  );
  const [surveyResponse, setSurveyResponse] = useState(
    /** @type {string | null} */ (null),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    void loadOrderDetails();
  }, []);

  async function loadOrderDetails() {
    const orderId = data.selected[0]?.id;

    if (!orderId) {
      setLoading(false);
      setError(i18n.translate("missingOrder"));
      return;
    }

    try {
      const { data: result, errors } = await query(
        `#graphql
          query OrderCheckoutDetails($id: ID!) {
            order(id: $id) {
              deliveryInstructions: metafield(
                namespace: "${APP_METAFIELD_NAMESPACE}"
                key: "${DELIVERY_INSTRUCTIONS_KEY}"
              ) {
                value
              }
              surveyAttribution: metafield(
                namespace: "${APP_METAFIELD_NAMESPACE}"
                key: "${SURVEY_ATTRIBUTION_KEY}"
              ) {
                value
              }
            }
          }
        `,
        { variables: { id: orderId } },
      );

      if (errors?.length) {
        throw new Error(errors.map((entry) => entry.message).join(", "));
      }

      /** @type {{ order?: { deliveryInstructions?: { value?: string | null } | null; surveyAttribution?: { value?: string | null } | null } | null } | undefined} */
      const orderData = result;
      const instructions = orderData?.order?.deliveryInstructions?.value;
      const survey = orderData?.order?.surveyAttribution?.value;

      setDeliveryInstructions(
        typeof instructions === "string" && instructions.trim()
          ? instructions
          : null,
      );

      if (typeof survey === "string" && survey.trim()) {
        setSurveyResponse(SURVEY_LABELS[survey] ?? survey);
      } else {
        setSurveyResponse(null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : i18n.translate("loadError"),
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <s-admin-block heading={i18n.translate("heading")}>
        <s-stack direction="block" gap="base">
          <s-spinner accessibilityLabel={i18n.translate("loading")} />
        </s-stack>
      </s-admin-block>
    );
  }

  if (error) {
    return (
      <s-admin-block heading={i18n.translate("heading")}>
        <s-banner tone="critical">{error}</s-banner>
      </s-admin-block>
    );
  }

  return (
    <s-admin-block heading={i18n.translate("heading")}>
      <s-stack direction="block" gap="base">
        <s-stack direction="block" gap="small">
          <s-text type="strong">{i18n.translate("deliveryHeading")}</s-text>
          {deliveryInstructions ? (
            <s-text>{deliveryInstructions}</s-text>
          ) : (
            <s-text color="subdued">{i18n.translate("deliveryEmpty")}</s-text>
          )}
        </s-stack>
        <s-divider direction="inline" />
        <s-stack direction="block" gap="small">
          <s-text type="strong">{i18n.translate("surveyHeading")}</s-text>
          {surveyResponse ? (
            <s-text>{surveyResponse}</s-text>
          ) : (
            <s-text color="subdued">{i18n.translate("surveyEmpty")}</s-text>
          )}
        </s-stack>
      </s-stack>
    </s-admin-block>
  );
}
