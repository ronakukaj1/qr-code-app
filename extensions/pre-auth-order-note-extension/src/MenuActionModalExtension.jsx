/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { saveOrderNote } from "./saveOrderNote.js";

export default async () => {
  render(<MenuActionModalExtension />, document.body);
};

function MenuActionModalExtension() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  async function saveNote() {
    const orderId = shopify.orderId;
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      setError("Please enter a note.");
      return;
    }

    if (!orderId) {
      setError("Order is not available.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveOrderNote(orderId, trimmedNote);
      shopify.close();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your note.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <s-customer-account-action heading="Add a note to the order">
      {error ? <s-banner tone="critical">{error}</s-banner> : null}
      <s-text-area
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setError(null);
        }}
        rows={3}
        label="Note for the order"
      />

      <s-button
        slot="primary-action"
        type="submit"
        loading={loading}
        onClick={saveNote}
      >
        Add note
      </s-button>
      <s-button
        slot="secondary-actions"
        onClick={() => shopify.close()}
        variant="secondary"
      >
        Cancel
      </s-button>
    </s-customer-account-action>
  );
}
