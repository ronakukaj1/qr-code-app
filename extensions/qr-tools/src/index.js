/// <reference path="../shopify.d.ts" />

/**
 * @typedef {Object} QrCodeSummary
 * @property {string} handle
 * @property {string} [title]
 * @property {string} [productTitle]
 * @property {number} [scans]
 * @property {string} [destination]
 * @property {string} [createdAt]
 */

export default () => {
  shopify.tools.register(
    "search_qr_codes",
    /** @param {{ query?: string; first?: number }} input */
    async ({ query, first }) => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (first) params.set("first", String(first));

      const response = await fetch(`/api/sidekick/qrcode?${params}`);
      if (!response.ok) {
        return { results: [] };
      }
      const data = await response.json();

      return {
        results: (data.results ?? []).map(toResourceLink),
      };
    },
  );

  shopify.tools.register(
    "get_qr_code",
    /** @param {{ handle: string }} input */
    async ({ handle }) => {
      const response = await fetch(
        `/api/sidekick/qrcode?handle=${encodeURIComponent(handle)}`,
      );
      if (!response.ok) {
        return { results: [] };
      }

      const { qrCode } = await response.json();
      return { results: [toResourceLink(qrCode)] };
    },
  );
};

/** @param {QrCodeSummary} qr */
function toResourceLink(qr) {
  return {
    type: "resource_link",
    uri: `gid://application/qrcode/${qr.handle}`,
    name: qr.title || qr.handle,
    mimeType: "application/qrcode",
    _meta: {
      productTitle: qr.productTitle,
      scans: qr.scans,
      destination: qr.destination,
      createdAt: qr.createdAt,
    },
  };
}