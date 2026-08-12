/// <reference path="../shopify.d.ts" />

export default async () => {
  const {field, value, selectedCountryCode} = shopify.target;

  const response = await fetchSuggestions(
    field,
    value,
    selectedCountryCode,
    shopify.signal
  );
  /** @type {{ result: { suggestions: Array<{ global_address_key: string; text: string; matched: Array<{ offset: number; length: number }>; formattedAddress: Record<string, string> }> } }} */
  const { result } = await response.json();

  const suggestions = result.suggestions.map((suggestion) => {
    return {
      id: suggestion.global_address_key,
      label: suggestion.text,
      matchedSubstrings: suggestion.matched,
      formattedAddress: suggestion.formattedAddress,
    };
  });

  return { suggestions };
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
