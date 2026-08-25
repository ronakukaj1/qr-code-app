export default async function extension() {
  const {i18n} = shopify;

  // Repeat buyers — works on most dev stores without picking a product.
  const query = "number_of_orders >= 2";
  const queryToInsert = "number_of_orders >= 2";

  return [
    {
      title: i18n.translate("title"),
      description: i18n.translate("description"),
      createdOn: new Date("2023-08-15").toISOString(),
      query,
      queryToInsert,
    },
  ];
}
