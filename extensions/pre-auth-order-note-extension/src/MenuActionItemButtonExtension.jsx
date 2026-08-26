/// <reference path="../shopify.d.ts" />
import "@shopify/ui-extensions/customer-account/preact";
import { render } from "preact";

export default async () => {
  render(<MenuActionItemButtonExtension />, document.body);
};

function MenuActionItemButtonExtension() {
  return <s-button>Add note</s-button>;
}
