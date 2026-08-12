import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, ".shopify/dev-bundle/manifest.json");
const extensionPath = path.join(
  root,
  "extensions/my-post-purchase-ui-extension/src/index.jsx",
);

const cliUrl = process.argv[2]?.replace(/\/$/, "");

let appUrl = cliUrl;

if (!appUrl && fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const appHome = manifest.modules.find((module) => module.type === "app_home");
  appUrl = appHome?.config?.app_url?.replace(/\/$/, "");
}

if (!appUrl) {
  console.error(
    "Usage: pnpm sync:app-url -- https://your-url.trycloudflare.com",
  );
  console.error(
    "Or start `pnpm dev` first so .shopify/dev-bundle/manifest.json exists.",
  );
  process.exit(1);
}

const source = fs.readFileSync(extensionPath, "utf8");

if (!/const APP_URL = "[^"]+";/.test(source)) {
  console.error("Could not find APP_URL constant in post-purchase extension.");
  process.exit(1);
}

const updated = source.replace(
  /const APP_URL = "[^"]+";/,
  `const APP_URL = "${appUrl}";`,
);

fs.writeFileSync(extensionPath, updated);
console.log(`Updated post-purchase APP_URL to ${appUrl}`);
