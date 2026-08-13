/// <reference path="../shopify.d.ts" />

export default async () => {
  const {field, value, selectedCountryCode} = shopify.target;

  try {
    const response = await fetchSuggestions(
      field,
      value,
      selectedCountryCode,
      shopify.signal
    );

    if (!response.ok) {
      console.error(
        "[address-autocomplete] Suggestion request failed:",
        response.status,
      );
      return { suggestions: [] };
    }

    /** @type {{ result?: { suggestions?: Array<{ global_address_key: string; text: string; matched: Array<{ offset: number; length: number }>; formattedAddress: Record<string, string> }> } }} */
    const payload = await response.json();
    const rawSuggestions = payload.result?.suggestions ?? [];

    const suggestions = rawSuggestions.map((suggestion) => {
      return {
        id: suggestion.global_address_key,
        label: suggestion.text,
        matchedSubstrings: suggestion.matched,
        formattedAddress: suggestion.formattedAddress,
      };
    });

    return { suggestions };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { suggestions: [] };
    }

    console.error("[address-autocomplete] Failed to load suggestions:", error);
    return { suggestions: [] };
  }
};

/**
 * In this example, suggestions are fetched from a static file. In your implementation,
 * use the address field and its current query value to fetch meaningful address suggestions.
 *
 * @param {'address1' | 'zip'} _field
 * @param {string} _value
 * @param {import('@shopify/ui-extensions/purchase.address-autocomplete.suggest').Api['target']['selectedCountryCode']} _selectedCountryCode
 * @param {AbortSignal} signal
 */
async function fetchSuggestions(_field, _value, _selectedCountryCode, signal) {
  return fetch(
    `https://shopify.github.io/address-autocomplete/address-autocomplete.json`,
    {
      // Pass `signal` to each fetch request
      signal,
    }
  );
}
