## When to Use QR Code Tools

Use these tools when the merchant asks about:
- QR codes for products
- Scan counts or QR code performance
- Which products have QR codes
- QR code destinations (product page, checkout, etc.)

## Guidelines

- "QR code" and "QR" mean the same thing in this app
- Each QR code is linked to one product and variant
- Scan count is stored on the QR code metaobject
- When comparing performance, use `_meta.scans`
- If the merchant wants to edit a QR code, link them to the QR code in the app

## Common Questions

- "Which QR codes have the most scans?" → search_qr_codes, sort by scans in _meta
- "Does product X have a QR code?" → search_qr_codes with query = product name
- "How many scans on [title]?" → get_qr_code with the handle