import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/index.js' {
  interface SearchQrCodesInput {
    /**
     * Optional text to filter QR codes by title or product name
     */
    query?: string;
    /**
     * Max results to return (default 10)
     */
    first?: number;
    [k: string]: unknown;
  }

  type SearchQrCodesOutput = unknown;
  interface GetQrCodeInput {
    /**
     * The QR code handle (slug identifier)
     */
    handle: string;
    [k: string]: unknown;
  }

  type GetQrCodeOutput = unknown;
  interface ShopifyTools {
    /**
     * Search QR codes by title or product name. Returns scan counts, destinations, and product links.
     */
    register(
      name: 'search_qr_codes',
      handler: (
        input: SearchQrCodesInput,
      ) => SearchQrCodesOutput | Promise<SearchQrCodesOutput>,
    ): () => void;
    /**
     * Get details for one QR code by its handle, including scans and linked product
     */
    register(
      name: 'get_qr_code',
      handler: (
        input: GetQrCodeInput,
      ) => GetQrCodeOutput | Promise<GetQrCodeOutput>,
    ): () => void;
  }

  const shopify: import('@shopify/ui-extensions/admin').WithGeneratedTools<
    import('@shopify/ui-extensions/admin.app.tools.data').Api,
    ShopifyTools
  >;
  const globalThis: { shopify: typeof shopify };
}
