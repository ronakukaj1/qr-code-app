/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import {
  b2bProblemOptions,
  dtcProblemOptions,
  getProblemLabel,
} from "./problemOptions.js";
import { submitReportedProblem } from "./submitReportedProblem.js";

export default async () => {
  render(<MenuActionModalExtension />, document.body);
};

function MenuActionModalExtension() {
  const [currentProblem, setCurrentProblem] = useState("1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const isB2BCustomer =
    shopify.authenticatedAccount.purchasingCompany.value != null;
  const options = isB2BCustomer ? b2bProblemOptions : dtcProblemOptions;

  async function onSubmit() {
    const orderId = shopify.orderId;
    const problemLabel = getProblemLabel(currentProblem, isB2BCustomer);

    if (!orderId) {
      setError("Order is not available.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await submitReportedProblem(orderId, problemLabel);
      shopify.close();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the reported problem.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <s-customer-account-action heading="Report a problem">
      {error ? <s-banner tone="critical">{error}</s-banner> : null}
      <s-select
        label="Select a problem"
        value={currentProblem}
        onChange={(e) => {
          setCurrentProblem(e.target.value);
          setError(null);
        }}
      >
        {options.map((option) => (
          <s-option key={option.value} value={option.value}>
            {option.label}
          </s-option>
        ))}
      </s-select>

      <s-button
        slot="primary-action"
        loading={isLoading}
        onClick={() => onSubmit()}
      >
        Report
      </s-button>
      <s-button slot="secondary-actions" onClick={() => shopify.close()}>
        Cancel
      </s-button>
    </s-customer-account-action>
  );
}
