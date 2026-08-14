import path from "node:path";
import { fileURLToPath } from "node:url";
import { runShopifyWithRetries } from "./shopify-dev-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const extraArgs = process.argv.slice(2);

const exitCode = await runShopifyWithRetries(
  ["app", "dev", "--config", "shopify.app.toml", ...extraArgs],
  root,
);

process.exit(exitCode);
