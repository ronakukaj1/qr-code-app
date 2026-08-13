/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
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
  const [attributionSubmitted, setAttributionSubmitted] = useStorageState(
    "attribution-submitted",
  );

  async function handleSubmit() {
    if (!attribution) {
      setError("Please select an option.");
      return;
    }

    const orderId = shopify.order.value?.id;
    const shopDomain = shopify.shop.myshopifyDomain;

    if (!orderId) {
      setError("Order is not available.");
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
      throw submitError;
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
