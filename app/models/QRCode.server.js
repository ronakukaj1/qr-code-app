import invariant from "tiny-invariant";
import QRCode from "qrcode";
import { redirect } from "react-router";

import { withGraphqlRetry } from "../graphql-retry.server";
import { unauthenticated } from "../shopify.server";

const METAOBJECT_TYPE = "$app:qrcode";



export async function getQRCode(handle, graphql, shop) {
    const response = await withGraphqlRetry(
      () =>
        graphql(
        `
        query GetQRCode($handle: MetaobjectHandleInput!){
            metaobjectByHandle(handle: $handle){
                id
                handle
                updatedAt
                title: field(key: "title"){jsonValue}
                product: field(key: "product"){
                    jsonValue
                    reference{
                        ... on Product {
                            handle
                            title
                            media(first: 1){
                                nodes{
                                    preview{
                                        image{ url altText}
                                    }
                                }
                            }
                        }
                    }
                }
                productVariant: field(key: "product_variant"){
                    reference {
                        ... on ProductVariant { id legacyResourceId}
                    }
                }
                destination: field(key: "destination") {jsonValue}
                scans: field(key: "scan_count") {jsonValue}
            }
        }
        
        `,
        {
            variables: {
                handle:{ type: METAOBJECT_TYPE, handle },
            },
        },
    ),
      { label: "getQRCode" },
    );

    const {data} = await response.json();
    const metaobject = data?.metaobjectByHandle;

if(!metaobject){
    return null;
}
return transformMetaobject(metaobject, shop);

}

export async function getQRCodes (graphql, shop){
    const response = await withGraphqlRetry(
      () =>
        graphql(
        `
        query GetQRCodes($type: String!){
            metaobjects(type: $type, first: 50, sortKey: "updated_at", reverse: true){
                nodes{
                    id
                    handle
                    updatedAt
                    title: field(key: "title") { jsonValue}
                    product: field(key: "product"){
                        jsonValue
                        reference{
                            ... on Product {
                                handle 
                                title
                                media(first: 1){
                                    nodes{
                                        preview{
                                            image{ url altText}

                                        }
                                    }
                                }
                            }
                        }
                    }
                    productVariant: field(key: "product_variant"){
                        reference{
                            ... on ProductVariant {id legacyResourceId }
                        }
                    }
                    
                    destination: field(key: "destination"){jsonValue}
                    scans: field(key: "scan_count") {jsonValue}
                }

            }

        } 
        `,
        {
        variables: {
            type: METAOBJECT_TYPE,
        },
    },
    ),
      { label: "getQRCodes" },
    );

    const {data} = await response.json();
    const metaobjects = data?.metaobjects?.nodes ?? [];

    return Promise.all(metaobjects.map((mo) => transformMetaobject(mo, shop)));

}

export async function getQRCodeByProductId(productId, graphql, shop) {
  const productGid = String(productId).startsWith("gid://")
    ? String(productId)
    : `gid://shopify/Product/${productId}`;

  const response = await graphql(
    `
      query GetQRCodesForProduct($type: String!) {
        metaobjects(type: $type, first: 50, sortKey: "updated_at", reverse: true) {
          nodes {
            id
            handle
            updatedAt
            title: field(key: "title") { jsonValue }
            product: field(key: "product") {
              jsonValue
              reference {
                ... on Product {
                  handle
                  title
                  media(first: 1) {
                    nodes {
                      preview {
                        image { url altText }
                      }
                    }
                  }
                }
              }
            }
            productVariant: field(key: "product_variant") {
              reference {
                ... on ProductVariant { id legacyResourceId }
              }
            }
            destination: field(key: "destination") { jsonValue }
            scans: field(key: "scan_count") { jsonValue }
          }
        }
      }
    `,
    {
      variables: {
        type: METAOBJECT_TYPE,
      },
    },
  );

  const { data } = await response.json();
  const metaobjects = data?.metaobjects?.nodes ?? [];
  const metaobject = metaobjects.find(
    (node) => node.product?.jsonValue === productGid,
  );

  if (!metaobject) {
    return null;
  }

  return transformMetaobject(metaobject, shop);
}

async function transformMetaobject(metaobject, shop){
    const product = metaobject.product?.reference;
    const productVariant = metaobject.productVariant?.reference;
    const productId = metaobject.product?.jsonValue;
    
    const qrCode={
        id: metaobject.id,
        handle: metaobject.handle,
        title: metaobject.title?.jsonValue,
        productId,
        productVariantId: productVariant?.id,
        productHandle: product?.handle,
        productVariantLegacyId: productVariant?.legacyResourceId,
        destination: metaobject.destination?.jsonValue,
        scans: metaobject.scans?.jsonValue ?? 0,
        createdAt: metaobject.updatedAt,
        productDeleted: productId && !product,
        productTitle: product?.title,
        productImage: product?.media?.nodes[0]?.preview?.image?.url,
        productAlt: product?.media?.nodes[0]?.preview?.image?.altText,
      };
    
    qrCode.destinationUrl = getDestinationUrl(qrCode, shop);
      qrCode.image = await getQRCodeImage(metaobject.handle, shop);
    
      return qrCode;
    }

      export async function getQRCodeImage(handle, shop) {
        return QRCode.toDataURL(getQRCodeScanUrl(handle, shop));
      }

      export function getQRCodeScanUrl(handle, shop) {
        return `https://${shop}/apps/qr-scan/${handle}`;
      }

      export async function processQRCodeScan(shop, handle) {
        const { admin } = await unauthenticated.admin(shop);

        const response = await admin.graphql(
          `
            query GetQRCodeScan($handle: MetaobjectHandleInput!) {
              metaobjectByHandle(handle: $handle) {
                id
                product: field(key: "product") {
                  reference {
                    ... on Product { handle }
                  }
                }
                productVariant: field(key: "product_variant") {
                  reference {
                    ... on ProductVariant { legacyResourceId }
                  }
                }
                destination: field(key: "destination") { jsonValue }
                scans: field(key: "scan_count") { jsonValue }
              }
            }
          `,
          {
            variables: {
              handle: { type: METAOBJECT_TYPE, handle },
            },
          },
        );

        const { data } = await response.json();
        const metaobject = data?.metaobjectByHandle;
        invariant(metaobject, "Could not find QR code destination");

        const currentScans = metaobject.scans?.jsonValue ?? 0;
        await incrementQRCodeScans(metaobject.id, currentScans, admin.graphql);

        const qrCode = {
          destination: metaobject.destination?.jsonValue,
          productHandle: metaobject.product?.reference?.handle,
          productVariantLegacyId:
            metaobject.productVariant?.reference?.legacyResourceId,
        };

        return redirect(getDestinationUrl(qrCode, shop));
      }

      export function getDestinationUrl(qrCode, shop) {
        if (qrCode.destination === "product") {
          return `https://${shop}/products/${qrCode.productHandle}?variant=${qrCode.productVariantLegacyId}`;
        }
      
        invariant(qrCode.productVariantLegacyId, "Unrecognised product variant ID");
      
        return `https://${shop}/cart/${qrCode.productVariantLegacyId}:1`;
      }

   

      export async function saveQRCode(handle, data, graphql) {
        const response = await graphql(
          `
            mutation UpsertQRCode($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
              metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                metaobject { id handle }
                userErrors { field message }
              }
            }
          `,
          {
            variables: {
              handle: { type: METAOBJECT_TYPE, handle },
              metaobject: {
                fields: [
                  { key: "title", value: data.title },
                  { key: "product", value: data.productId },
                  { key: "product_variant", value: data.productVariantId },
                  { key: "destination", value: data.destination },
                  { key: "scan_count", value: "0" }
                ],
              },
            },
          },
        );
      
        const { data: responseData } = await response.json();
        const { metaobjectUpsert } = responseData;
      
        if (metaobjectUpsert.userErrors.length) {
          throw new Error(metaobjectUpsert.userErrors[0].message);
        }
      
        return metaobjectUpsert.metaobject;
      }

      export async function deleteQRCode(id, graphql) {
        const response = await graphql(
          `
            mutation DeleteQRCode($id: ID!) {
              metaobjectDelete(id: $id) {
                deletedId
                userErrors { field message }
              }
            }
          `,
          {
            variables: { id },
          },
        );
      
        const { data } = await response.json();
      
        if (data.metaobjectDelete.userErrors.length) {
          throw new Error(data.metaobjectDelete.userErrors[0].message);
        }
      }

      export async function incrementQRCodeScans(id, currentScans, graphql) {
        const response = await graphql(
          `
            mutation IncrementScans($id: ID!, $metaobject: MetaobjectUpdateInput!) {
              metaobjectUpdate(id: $id, metaobject: $metaobject) {
                metaobject { id }
                userErrors { field message }
              }
            }
          `,
          {
            variables: {
              id,
              metaobject: {
                fields: [{ key: "scan_count", value: String(currentScans + 1) }],
              },
            },
          },
        );

        const { data } = await response.json();

        if (data.metaobjectUpdate.userErrors.length) {
          throw new Error(data.metaobjectUpdate.userErrors[0].message);
        }
      }
      function slugify(text) {
        return text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      
      export function generateHandle(title) {
        return `${slugify(title)}-${Date.now().toString(36)}`;
      }
      
      export function validateQRCode(data) {
        const errors = {};
      
        if (!data.title) {
          errors.title = "Title is required";
        }
      
        if (!data.productId) {
          errors.productId = "Product is required";
        }
      
        if (!data.destination) {
          errors.destination = "Destination is required";
        }
      
        if (Object.keys(errors).length) {
          return errors;
        }
      }