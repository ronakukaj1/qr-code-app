/// <reference path="../shopify.d.ts" />
import { useCallback, useEffect, useState } from "preact/hooks";

/**
 * Returns a piece of state that is persisted in local storage, and a function to update it.
 * The state returned contains a `data` property with the value, and a `loading` property that is true while the value is being fetched from storage.
 * @param {string} key
 * @returns {[{data: any, loading: boolean}, (value: any) => void]}
 */
export function useStorageState(key) {
  const { storage } = shopify;
  const [data, setData] = useState(/** @type {any} */ (undefined));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function queryStorage() {
      const value = await storage.read(key);
      setData(value);
      setLoading(false);
    }

    queryStorage();
  }, [storage, key]);

  const setStorage = useCallback(
    /** @param {any} value */
    (value) => {
      storage.write(key, value);
      setData(value);
    },
    [storage, key],
  );

  return [{ data, loading }, setStorage];
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   onSubmit: () => Promise<void>,
 *   children: import("preact").ComponentChildren,
 *   loading: boolean,
 *   error?: string | null,
 * }} props
 */
export function Survey({ title, description, onSubmit, children, loading, error }) {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    try {
      await onSubmit();
      setSubmitted(true);
    } catch {
      // Parent shows the error banner.
    }
  }

  if (submitted) {
    return (
      <s-box border="base" padding="base" borderRadius="base">
        <s-stack gap="base">
          <s-heading>Thanks for your feedback!</s-heading>
          <s-text>Your response has been submitted</s-text>
        </s-stack>
      </s-box>
    );
  }

  return (
    <s-box border="base" padding="base" borderRadius="base">
      <s-stack gap="base">
        <s-heading>{title}</s-heading>
        <s-text>{description}</s-text>
        {children}
        {error ? <s-banner tone="critical">{error}</s-banner> : null}
        <s-button variant="secondary" onClick={handleSubmit} loading={loading}>
          Submit feedback
        </s-button>
      </s-stack>
    </s-box>
  );
}
