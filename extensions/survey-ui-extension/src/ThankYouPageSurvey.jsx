/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { Survey, useStorageState } from "./shared.jsx";
import { submitSurvey } from "./submitSurvey.js";

export default function () {
  render(<Attribution />, document.body);
}

function Attribution() {
  const [attribution, setAttribution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const orderId = shopify.orderConfirmation.value?.order?.id;
  const [attributionSubmitted, setAttributionSubmitted] = useStorageState(
    orderId ? `attribution-submitted-${orderId}` : "attribution-submitted",
  );

  async function handleSubmit() {
    if (!attribution) {
      setError("Please select an option.");
      return;
    }

    const shopDomain = shopify.shop.myshopifyDomain;

    if (!orderId) {
      setError("Order is not available yet. Try again in a moment.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitSurvey({ orderId, attribution, shopDomain });
      setAttributionSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your response.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (attributionSubmitted.loading || attributionSubmitted.data === true) {
    return null;
  }

  return (
    <Survey
      title="How did you hear about us?"
      description="We would like to learn if you are enjoying your purchase."
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    >
      <s-choice-list
        name="sale-attribution"
        onChange={(event) => {
          setAttribution(
            /** @type {any} */ (event.currentTarget).values?.[0] ?? "",
          );
          setError(null);
        }}
      >
        <s-choice value="tv" selected={attribution === "tv"}>
          TV
        </s-choice>
        <s-choice value="podcast" selected={attribution === "podcast"}>
          Podcast
        </s-choice>
        <s-choice value="family" selected={attribution === "family"}>
          From a friend or family member
        </s-choice>
        <s-choice value="tiktok" selected={attribution === "tiktok"}>
          Tiktok
        </s-choice>
      </s-choice-list>
    </Survey>
  );
}
