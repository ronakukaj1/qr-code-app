import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/OrderStatusBlock.jsx' {
  const shopify: import('@shopify/ui-extensions/customer-account.order-status.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/FulfillmentDelivery.jsx' {
  const shopify:
    | import('@shopify/ui-extensions/customer-account.order-status.fulfillment-details.render-after').Api
    | import('@shopify/ui-extensions/customer-account.order-status.unfulfilled-items.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
