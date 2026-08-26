const API_VERSION = "2026-07";
const METAFIELD_NAMESPACE = "$app";
const ORDER_NOTE_KEY = "orderNote";

const SAVE_ORDER_NOTE_MUTATION = `mutation SaveOrderNote($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      value
    }
    userErrors {
      field
      message
    }
  }
}`;

/**
 * @param {string} orderId
 * @param {string} note
 */
export async function saveOrderNote(orderId, note) {
  const response = await fetch(
    `shopify:customer-account/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: SAVE_ORDER_NOTE_MUTATION,
        variables: {
          metafields: [
            {
              ownerId: orderId,
              namespace: METAFIELD_NAMESPACE,
              key: ORDER_NOTE_KEY,
              type: "multi_line_text_field",
              value: note,
            },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Could not save your note.");
  }

  const { data, errors } = await response.json();
  const userError = data?.metafieldsSet?.userErrors?.[0]?.message;
  const graphQLError = errors?.[0]?.message;

  if (userError || graphQLError) {
    throw new Error(userError || graphQLError);
  }
}
