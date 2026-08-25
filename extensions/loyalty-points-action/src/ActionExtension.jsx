import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { updateLoyaltyPoints } from "./utils.js";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const { i18n, close, data } = shopify;
  const segmentId = data.selected[0]?.id;

  const [segmentName, setSegmentName] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!segmentId) {
      return;
    }

    (async function getSegmentInfo() {
      const getSegmentQuery = {
        query: `query Segment($id: ID!) {
          segment(id: $id) {
            name
          }
        }`,
        variables: { id: segmentId },
      };

      const res = await fetch("shopify:admin/api/graphql.json", {
        method: "POST",
        body: JSON.stringify(getSegmentQuery),
      });

      if (!res.ok) {
        console.error("Network error");
        return;
      }

      const segmentData = await res.json();
      setSegmentName(segmentData.data?.segment?.name ?? "");
    })();
  }, [segmentId]);

  const onSubmit = useCallback(async () => {
    if (!segmentId) {
      return;
    }

    setSubmitting(true);
    try {
      await updateLoyaltyPoints(segmentId, loyaltyPoints);
      close();
    } finally {
      setSubmitting(false);
    }
  }, [close, loyaltyPoints, segmentId]);

  return (
    <s-admin-action>
      <s-stack direction="block" gap="base">
        <s-text>
          {i18n.translate("description", {
            segment: segmentName || i18n.translate("unnamedSegment"),
          })}
        </s-text>
        <s-number-field
          label={i18n.translate("label")}
          value={String(loyaltyPoints)}
          min={0}
          max={100}
          onChange={(event) => {
            setLoyaltyPoints(
              Number(/** @type {HTMLInputElement} */ (event.target).value) ||
                0,
            );
          }}
        />
      </s-stack>
      <s-button slot="primary-action" onClick={onSubmit} disabled={submitting}>
        {i18n.translate("done")}
      </s-button>
      <s-button slot="secondary-actions" onClick={() => close()}>
        {i18n.translate("close")}
      </s-button>
    </s-admin-action>
  );
}
