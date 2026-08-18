import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store =
  process.env.SHOPIFY_FLAG_STORE ?? "rona-store-jg0xpxsa.myshopify.com";

const BUNDLE_TITLE = "Snowboard Bundle";
const COMPONENT_TITLES = [
  "The Collection Snowboard: Hydrogen",
  "The Collection Snowboard: Oxygen",
];

function runGraphql(query, variables) {
  const args = [
    "app",
    "execute",
    "-s",
    store,
    "-q",
    query,
  ];

  if (variables) {
    args.push("-v", JSON.stringify(variables));
  }

  const result = spawnSync("shopify", args, {
    cwd: appRoot,
    encoding: "utf8",
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`GraphQL command failed: ${query.slice(0, 80)}...`);
  }

  const jsonMatch = result.stdout.match(/\{[\s\S]*\}\s*$/);
  if (!jsonMatch) {
    throw new Error(`Could not parse GraphQL response:\n${result.stdout}`);
  }

  const payload = JSON.parse(jsonMatch[0]);
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("\n"));
  }

  return payload;
}

function collectUserErrors(data) {
  const errors = [];

  for (const value of Object.values(data)) {
    if (value && typeof value === "object" && Array.isArray(value.userErrors)) {
      errors.push(...value.userErrors);
    }
  }

  return errors.filter((error) => error.message);
}

function findProductByTitle(products, title) {
  return products.find((product) => product.title === title);
}

async function main() {
  console.log(`Setting up snowboard bundle on ${store}...\n`);

  const definitionLookup = runGraphql(`
    {
      metafieldDefinitions(
        first: 1
        ownerType: PRODUCTVARIANT
        namespace: "custom"
        key: "component_reference"
      ) {
        nodes { id }
      }
    }
  `);

  if (definitionLookup.metafieldDefinitions.nodes.length === 0) {
    const definitionResult = runGraphql(`
      mutation {
        metafieldDefinitionCreate(
          definition: {
            key: "component_reference"
            type: "list.variant_reference"
            namespace: "custom"
            name: "bundle component reference"
            ownerType: PRODUCTVARIANT
          }
        ) {
          createdDefinition { id }
          userErrors { field message }
        }
      }
    `);

    const definitionErrors = collectUserErrors(definitionResult);
    if (definitionErrors.length) {
      throw new Error(
        definitionErrors.map((error) => error.message).join("\n"),
      );
    }
  }

  const productsResult = runGraphql(`
    {
      products(first: 50, query: "snowboard") {
        nodes {
          id
          title
          status
          variants(first: 5) {
            nodes {
              id
              title
              requiresComponents
              metafield(namespace: "custom", key: "component_reference") {
                jsonValue
              }
            }
          }
        }
      }
    }
  `);

  const products = productsResult.products.nodes;
  const componentVariants = COMPONENT_TITLES.map((title) => {
    const product = findProductByTitle(products, title);
    const variant = product?.variants.nodes[0];

    if (!variant) {
      throw new Error(`Missing component product: ${title}`);
    }

    return variant;
  });

  let bundleProduct = findProductByTitle(products, BUNDLE_TITLE);
  let bundleVariant = bundleProduct?.variants.nodes[0];

  if (!bundleProduct) {
    const createResult = runGraphql(`
      mutation {
        productCreate(
          product: {
            title: "${BUNDLE_TITLE}"
            status: ACTIVE
            descriptionHtml: "<p>Bundle of ${COMPONENT_TITLES.join(" and ")}.</p>"
          }
        ) {
          product {
            id
            title
            variants(first: 1) {
              nodes { id }
            }
          }
          userErrors { field message }
        }
      }
    `);

    const createErrors = collectUserErrors(createResult);
    if (createErrors.length) {
      throw new Error(createErrors.map((error) => error.message).join("\n"));
    }

    bundleProduct = createResult.productCreate.product;
    bundleVariant = bundleProduct.variants.nodes[0];
    console.log(`Created bundle product: ${bundleProduct.title}`);
  } else {
    console.log(`Found existing bundle product: ${bundleProduct.title}`);
  }

  const componentValue = JSON.stringify(
    componentVariants.map((variant) => variant.id),
  );

  const updateResult = runGraphql(
    `
      mutation SetupBundle($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            requiresComponents
            metafield(namespace: "custom", key: "component_reference") {
              jsonValue
            }
          }
          userErrors { field message }
        }
      }
    `,
    {
      productId: bundleProduct.id,
      variants: [
        {
          id: bundleVariant.id,
          requiresComponents: true,
          metafields: [
            {
              namespace: "custom",
              key: "component_reference",
              type: "list.variant_reference",
              value: componentValue,
            },
          ],
        },
      ],
    },
  );

  const updateErrors = collectUserErrors(updateResult);
  if (updateErrors.length) {
    throw new Error(updateErrors.map((error) => error.message).join("\n"));
  }

  const updatedVariant =
    updateResult.productVariantsBulkUpdate.productVariants[0];

  const cartTransformResult = runGraphql(`
    mutation {
      cartTransformCreate(functionHandle: "demo-cart-transform-extension") {
        cartTransform { id functionId }
        userErrors { field message }
      }
    }
  `);

  const cartTransformErrors = collectUserErrors(cartTransformResult).filter(
    (error) => !/already|limit|one/i.test(error.message),
  );

  if (cartTransformErrors.length) {
    throw new Error(
      cartTransformErrors.map((error) => error.message).join("\n"),
    );
  }

  console.log("\nSnowboard bundle is ready.\n");
  console.log(`Bundle product: ${bundleProduct.title}`);
  console.log(`Bundle variant: ${updatedVariant.id}`);
  console.log("Components:");
  for (const [index, title] of COMPONENT_TITLES.entries()) {
    console.log(`  - ${title}: ${componentVariants[index].id}`);
  }
  console.log(
    `\nMetafield value: ${JSON.stringify(updatedVariant.metafield?.jsonValue ?? [])}`,
  );
  console.log(
    `\nTest: add "${BUNDLE_TITLE}" to cart on your storefront, then go to checkout.`,
  );
}

main().catch((error) => {
  console.error(`\nSetup failed: ${error.message}`);
  process.exit(1);
});
