function getDocumentInfo(type) {
  switch (type) {
    case "invoice":
      return {
        label: "Receipt / Invoice",
        content: `
            <p>Official Receipt/Invoice document</p>
            <p>Contains detailed payment and tax information</p>
            <p>Order details and pricing breakdown</p>
          `,
      };
    case "packing-slip":
      return {
        label: "Packing Slip",
        content: `
            <p>Shipping and fulfillment details</p>
            <p>Complete list of items in order</p>
            <p>Shipping address and instructions</p>
          `,
      };
    case "returns-form":
      return {
        label: "Returns Form",
        content: `
            <p>Return Authorization Form</p>
            <p>Return shipping instructions</p>
            <p>Items eligible for return</p>
          `,
      };
    case "draft-orders-quote":
      return {
        label: "Draft Orders Quote",
        content: `
            <p>Custom Order Quote</p>
            <p>Detailed pricing breakdown</p>
            <p>Terms and conditions</p>
          `,
      };
    case "refund-credit-note":
      return {
        label: "Refund / Credit Note",
        content: `
            <p>Refund Documentation</p>
            <p>Credit amount details</p>
            <p>Returned items list</p>
          `,
      };
    default:
      return {
        label: type,
        content: `
            <p>Sample document</p>
            <p>This is an example of a printable document.</p>
          `,
      };
  }
}

function createPage(type) {
  const email = "<!--email_off-->customerhelp@example.com<!--/email_off-->";
  const { label, content } = getDocumentInfo(type);

  return `<main>
    <div>
      <h1>${label}</h1>
      <div class="content">
        ${content}
        <hr>
        <p>Contact us: ${email}</p>
      </div>
    </div>
  </main>`;
}

function printHTML(pages) {
  const pageBreak = `<div class="page-break"></div>`;
  const pageBreakStyles = `
    @media not print {
      .page-break {
        width: 100vw;
        height: 40px;
        background-color: lightgray;
      }
    }
    @media print {
      .page-break {
        page-break-after: always;
      }
    }`;

  const joinedPages = pages.join(pageBreak);

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <title>Print Document</title>
    <style>
      body, html {
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      main {
        padding: 2rem;
      }
      h1 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }
      .content {
        font-size: 1rem;
        line-height: 1.5;
      }
      hr {
        margin: 1.5rem 0;
        border: none;
        border-top: 1px solid #000;
      }
      ${pageBreakStyles}
    </style>
  </head>
  <body>
    ${joinedPages}
  </body>
  </html>`;
}

export function buildPrintHtml(printTypes) {
  const pages = printTypes.map((type) => createPage(type));
  return printHTML(pages);
}

const ORDER_PRINT_TITLE = "<title>My order printer</title>";

function orderPage(docType, order) {
  const price = order.totalPriceSet.shopMoney.amount;
  const name = order.name;
  const createdAt = order.createdAt.split("T")[0];
  const email = "<!--email_off-->customerhelp@example.com<!--/email_off-->";

  return `<main>
      <div>
        <div class="columns">
          <h1>${docType}</h1>
          <div>
            <p style="text-align: right; margin: 0;">
              Order ${name}<br>
              ${createdAt}
            </p>
          </div>
        </div>
        <div class="columns" style="margin-top: 1.5em;">
          <div class="address">
            <strong>From</strong><br>
            Top Quality Copper Ingots<br>
            <p>123 Broadway<br>
              Denver CO, 80220<br>
              United States</p>
            (123) 456-7891<br>
          </div>
        </div>
        <hr>
        <p>Order total: $${price}</p>
        <p style="margin-bottom: 0;">If you have any questions, please send an email to ${email}</p>
      </div>
    </main>`;
}

function orderPrintHTML(pages) {
  const pageBreak = `<div class="page-break"></div>`;
  const pageBreakStyles = `
  @media not print {
        .page-break {
          width: 100vw;
          height: 40px;
          background-color: lightgray;
        }
      }
      @media print {
        .page-break {
          page-break-after: always;
        }
      }`;

  const joinedPages = pages.join(pageBreak);

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <style>
      body,html {
        font-size: 16px;
        line-height: normal;
        background: none;
        margin: 0;
        padding: 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
      body {
        font-size: 0.688rem;
        color: #000;
      }
      main {
        padding: 3rem 2rem;
        height: 100vh;
      }
      h1 {
        font-size: 2.5rem;
        margin: 0;
      }
      h2,h3 {
        font-size: 0.75rem;
        font-weight: bold;
      }
      h2,h3,p {
        margin: 1rem 0 0.5rem 0;
      }
      .address p {
        margin: 0;
      }
      b,strong {
        font-weight: bold;
      }
      .columns {
        display: grid;
        grid-auto-columns: minmax(0, 1fr);
        grid-auto-flow: column;
        word-break: break-word;
      }
      hr {
        clear: both;
        overflow: hidden;
        margin: 1.5em 0;
        border-top: 1px solid #000;
        border-bottom: none;
      }
      ${pageBreakStyles}
    </style>
    ${ORDER_PRINT_TITLE}
  </head>
  <body>
    ${joinedPages}
  </body>
  </html>`;
}

export function buildOrderPrintHtml(docTypes, order) {
  const pages = docTypes.map((docType) => orderPage(docType, order));
  return orderPrintHTML(pages);
}

export async function fetchOrderForPrint(admin, orderId) {
  const response = await admin.graphql(
    `#graphql
      query getOrder($orderId: ID!) {
        order(id: $orderId) {
          name
          createdAt
          totalPriceSet {
            shopMoney {
              amount
            }
          }
        }
      }
    `,
    {
      variables: {
        orderId,
      },
    },
  );

  const orderData = await response.json();

  if (orderData.errors?.length) {
    throw new Error(orderData.errors[0].message);
  }

  if (!orderData.data?.order) {
    throw new Error("Order not found.");
  }

  return orderData.data.order;
}
