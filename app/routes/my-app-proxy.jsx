import { useLoaderData } from "react-router";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  return {
    shop,
    proxyPath: "/apps/qr-scan",
  };
};

export default function AppProxyIndex() {
  const { shop, proxyPath } = useLoaderData();

  return (
    <main style={styles.page}>
      <h1 style={styles.title}>QR Code scans</h1>
      <p style={styles.text}>
        Scan a QR code created in the QRCode-rona app to open a product or add it
        to cart. Each scan is counted automatically.
      </p>
      {shop ? (
        <p style={styles.text}>
          Example scan URL format:{" "}
          <code>{`https://${shop}${proxyPath}/your-qr-handle`}</code>
        </p>
      ) : null}
    </main>
  );
}

const styles = {
  page: {
    fontFamily: "Inter, system-ui, sans-serif",
    maxWidth: "640px",
    margin: "0 auto",
    padding: "24px 16px",
    color: "#202223",
  },
  title: {
    marginTop: 0,
  },
  text: {
    lineHeight: 1.5,
    color: "#444",
  },
};
