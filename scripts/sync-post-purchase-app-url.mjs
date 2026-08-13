import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, ".shopify/dev-bundle/manifest.json");

const targetFiles = [
  path.join(
    root,
    "extensions/my-post-purchase-ui-extension/src/app-url.js",
  ),
  path.join(root, "extensions/survey-ui-extension/src/app-url.js"),
];

const cliUrl = process.argv[2]?.replace(/\/$/, "");

/** @param {string} appUrl */
async function isAppUrlReachable(appUrl) {
  if (!appUrl || appUrl.includes("example.com")) {
    return false;
  }

  try {
    const response = await fetch(appUrl, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });

    // Any response from the tunnel means DNS + routing work.
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  }
}

function readManifestAppUrl() {
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const appHome = manifest.modules.find((module) => module.type === "app_home");
  return appHome?.config?.app_url?.replace(/\/$/, "") ?? null;
}

let appUrl = cliUrl ?? readManifestAppUrl();

if (!appUrl) {
  console.error(
    "No app URL found. Start `shopify app dev`, wait for Ready, then run this again.",
  );
  process.exit(1);
}

if (!(await isAppUrlReachable(appUrl))) {
  console.error(
    `Tunnel URL is not reachable yet: ${appUrl}`,
  );
  console.error(
    "Keep `shopify app dev` running until you see Ready, then run: pnpm sync:app-url",
  );
  process.exit(1);
}

for (const extensionPath of targetFiles) {
  const source = fs.readFileSync(extensionPath, "utf8");
  const appUrlPattern = /export const APP_URL =\s*\n?\s*"[^"]+";/;

  if (!appUrlPattern.test(source)) {
    console.error(`Could not find APP_URL constant in ${extensionPath}.`);
    process.exit(1);
  }

  const replacement = `export const APP_URL =\n  "${appUrl}";`;

  fs.writeFileSync(extensionPath, source.replace(appUrlPattern, replacement));
  console.log(`Updated APP_URL in ${path.relative(root, extensionPath)}`);
}

console.log(`Synced live app URL: ${appUrl}`);
