/// <reference path="../shopify.d.ts" />
import { APP_URL } from "./app-url.js";

/**
 * @param {{ orderId: string; attribution: string; shopDomain: string }} input
 */
export async function submitSurvey({ orderId, attribution, shopDomain }) {
  if (!orderId || !attribution || !shopDomain) {
    throw new Error("Missing order or survey response.");
  }

  if (!APP_URL || APP_URL.includes("example.com")) {
    throw new Error(
      "App URL is not configured. Run `pnpm sync:app-url` while dev is running, then refresh checkout.",
    );
  }

  const token = await shopify.sessionToken.get();
  const surveyUrl = `${APP_URL.replace(/\/$/, "")}/api/survey`;

  let response;

  try {
    response = await fetch(surveyUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        attribution,
        shop: shopDomain,
      }),
    });
  } catch (error) {
    console.error("[survey] Network request failed:", error);
    throw new Error(
      "Could not reach the app. Run `pnpm sync:app-url`, refresh checkout, and try again.",
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Could not save survey response.");
  }
}
