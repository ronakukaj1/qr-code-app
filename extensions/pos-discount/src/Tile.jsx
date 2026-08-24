import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";

const MIN_SUBTOTAL = 0;

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  /** @param {string | number} subtotal */
  const shouldDisable = (subtotal) => Number(subtotal) < MIN_SUBTOTAL;

  const initialSubtotal = shopify.cart.current.value.subtotal;
  const [disabled, setDisabled] = useState(shouldDisable(initialSubtotal));
  const [subtotal, setSubtotal] = useState(initialSubtotal);

  useEffect(() => {
    const unsubscribe = shopify.cart.current.subscribe((cart) => {
      setSubtotal(cart.subtotal);
      setDisabled(shouldDisable(cart.subtotal));
    });

    return unsubscribe;
  }, []);

  const formattedSubtotal = Number(subtotal).toFixed(2);
  const subheading = disabled
    ? `Cart $${formattedSubtotal} — add items to cart first`
    : `Cart $${formattedSubtotal} — tap for discounts`;

  return (
    <s-tile
      heading="Discount Example App"
      subheading={subheading}
      onClick={() => shopify.action.presentModal()}
      disabled={disabled}
    />
  );
}
