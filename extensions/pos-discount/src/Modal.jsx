import "@shopify/ui-extensions/preact";
import {render} from "preact";

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  /**
   * @param {"Percentage" | "FixedAmount"} type
   * @param {string} title
   * @param {string} amount
   */
  const onButtonClick = (type, title, amount) => {
    shopify.cart.applyCartDiscount(type, title, amount);
    shopify.toast.show("Discount applied");
  };

  return (
    <s-page heading="Available Discounts">
      <s-scroll-box padding="base">
        <s-button onClick={() => onButtonClick("Percentage", "25% off", "25")}>
          25%
        </s-button>
        <s-button onClick={() => onButtonClick("FixedAmount", "$10 off", "10")}>
          $10
        </s-button>
      </s-scroll-box>
    </s-page>
  );
}
