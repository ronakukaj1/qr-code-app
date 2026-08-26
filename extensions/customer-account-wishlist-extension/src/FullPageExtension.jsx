/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  fetchWishlistProducts,
  loadWishlist,
  removeWishlistProduct,
} from "./wishlist.js";

export default function () {
  render(<FullPageExtension />, document.body);
}

function FullPageExtension() {
  const [wishlist, setWishlist] = useState(/** @type {any[]} */ ([]));
  const [productIds, setProductIds] = useState(/** @type {string[]} */ ([]));
  const [customerId, setCustomerId] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [removeLoading, setRemoveLoading] = useState({
    id: /** @type {string | null} */ (null),
    loading: false,
  });

  async function fetchWishlist() {
    setLoading(true);
    setError(null);

    try {
      const result = await loadWishlist();
      setCustomerId(result.customerId);
      setProductIds(
        result.products.map((product) => product.id).filter(Boolean),
      );
      setWishlist(result.products);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your wishlist.",
      );
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }

  /**
   * @param {string} id
   */
  async function deleteWishlistItem(id) {
    if (!customerId) {
      setError("Customer is not available.");
      return;
    }

    setRemoveLoading({ loading: true, id });
    setError(null);

    try {
      const nextProductIds = await removeWishlistProduct(
        customerId,
        productIds,
        id,
      );
      setProductIds(nextProductIds);
      setWishlist(await fetchWishlistProducts(nextProductIds));
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove this item.",
      );
    } finally {
      setRemoveLoading({ loading: false, id: null });
    }
  }

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <s-page heading="Wishlist">
      {error ? <s-banner tone="critical">{error}</s-banner> : null}
      <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
        {!loading &&
          wishlist.length > 0 &&
          wishlist.map((product) => {
            return (
              <s-section key={product.id}>
                <s-stack direction="block" gap="base" paddingBlockEnd="large">
                  {product.featuredImage?.url ? (
                    <s-image src={product.featuredImage.url} />
                  ) : null}
                  <s-stack direction="block" gap="small-500">
                    <s-text color="subdued">{product.title}</s-text>
                    <s-text type="strong">
                      {shopify.i18n.formatCurrency(
                        product.priceRange.minVariantPrice.amount,
                        {
                          currency:
                            product.priceRange.minVariantPrice.currencyCode,
                        },
                      )}
                    </s-text>
                  </s-stack>
                </s-stack>
                <s-button slot="primary-action" href={product.onlineStoreUrl}>
                  View product
                </s-button>
                <s-button
                  slot="secondary-actions"
                  loading={
                    removeLoading.loading && product.id === removeLoading.id
                  }
                  onClick={() => {
                    deleteWishlistItem(product.id);
                  }}
                >
                  Remove
                </s-button>
              </s-section>
            );
          })}
        {!loading && wishlist.length === 0 && (
          <s-text>
            No items in your wishlist. Add products from the storefront while
            logged in.
          </s-text>
        )}
      </s-grid>
    </s-page>
  );
}
