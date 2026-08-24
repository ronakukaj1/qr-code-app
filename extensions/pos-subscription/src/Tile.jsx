import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";

export default function extension() {
  render(<Tile />, document.body);
}

function hasSubscriptionEligibleItems(cart) {
  return cart.lineItems.some(
    (lineItem) => lineItem.hasSellingPlanGroups === true,
  );
}

function getSubheading(cart, sellingPlanEligible) {
  if (sellingPlanEligible) {
    return "Subscriptions available";
  }

  if (cart.lineItems.length === 0) {
    return "Add a subscription product to cart";
  }

  return "No subscription products in cart";
}

function Tile() {
  const [cart, setCart] = useState(shopify.cart.current.value);
  const sellingPlanEligible = hasSubscriptionEligibleItems(cart);

  useEffect(() => {
    const unsubscribe = shopify.cart.current.subscribe((nextCart) => {
      setCart(nextCart);
    });

    return unsubscribe;
  }, []);

  return (
    <s-tile
      heading="Subscriptions"
      subheading={getSubheading(cart, sellingPlanEligible)}
      disabled={!sellingPlanEligible}
      onClick={() => shopify.action.presentModal()}
    />
  );
}
