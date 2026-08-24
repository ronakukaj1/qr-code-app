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
