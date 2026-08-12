/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { Survey, useStorageState } from "./shared.jsx";

export default function () {
  render(<Attribution />, document.body);
}

function Attribution() {
  const [attribution, setAttribution] = useState("");
  const [loading, setLoading] = useState(false);
  const [attributionSubmitted, setAttributionSubmitted] = useStorageState(
    "attribution-submitted",
  );

  async function handleSubmit() {
    setLoading(true);
    await new Promise((resolve) => {
      setTimeout(() => {
        console.log("Submitted:", attribution);
        setLoading(false);
        setAttributionSubmitted(true);
        resolve(undefined);
      }, 750);
    });
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
    >
      <s-choice-list
        name="sale-attribution"
        onChange={(event) => {
          setAttribution(
            /** @type {any} */ (event.currentTarget).values?.[0] ?? "",
          );
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
