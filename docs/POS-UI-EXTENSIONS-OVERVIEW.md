# POS UI Extensions — Overview

Conceptual introduction to Shopify POS UI Extensions. For setup, commands, code patterns, and troubleshooting, see the [Developer Playbook](./POS-UI-EXTENSIONS-GUIDE.md).

---

## 1. Introduction

POS UI Extensions allow Shopify apps to extend and customize the Shopify Point of Sale (POS) interface without modifying Shopify's core POS application.

They are used to:

- Add custom functionality to the Shopify POS interface
- Add interactive tiles to the POS home screen
- Add action and menu items to POS workflows
- Display custom inline content within POS screens
- Launch custom modal workflows
- Interact with products, customers, carts, orders, and other POS data
- Access POS-specific device capabilities when supported
- Connect POS experiences to an app's backend services when server-side functionality is required

**Key idea:** POS UI Extensions allow apps to integrate directly into Shopify POS and provide custom functionality exactly where merchants and staff need it. They are part of Shopify's app extension system and are designed to run within important merchant workflows while maintaining Shopify's security, performance, and user-experience standards.

---

## 2. Why POS UI Extensions Matter

POS UI Extensions are important because they allow developers to customize Shopify's in-person selling experience without building or replacing the entire POS application.

They provide:

- Native integration with Shopify POS
- Access to POS-specific data and functionality
- Consistent Shopify-style UI components
- Support for both iOS and Android POS experiences
- Access to device capabilities such as scanners, cameras, printers, and cash drawers where supported
- A controlled and secure extension environment
- Reusable functionality that can be distributed as part of a Shopify app

**Important:** POS UI Extensions are the modern Shopify-supported approach for adding custom functionality to the Point of Sale experience. Shopify provides specific extension targets and APIs so that apps can integrate into defined areas of POS rather than modifying the POS application itself.

---

## 3. Overview of POS UI Extensions

POS UI Extensions are built around three main parts:

### Targets

Targets determine where an extension appears within Shopify POS.

The main UI target types are:

| Type | Purpose |
|---|---|
| **Tile** | Adds functionality to the POS smart grid |
| **Action** | Adds actions to supported POS workflows (menu items and modals) |
| **Block** | Displays custom content inside supported POS screens |

Shopify also provides:

| Type | Purpose |
|---|---|
| **App background** | Session-long background logic without rendering UI (`pos.app.ready.data`, 2026-07+) |
| **Event observe** | React to POS lifecycle events (e.g. transaction complete, cart update) |

### Target APIs

Target APIs provide access to data and functionality relevant to the extension's target. They can provide access to functionality related to:

- Cart, customer, product, order, and draft order data
- Navigation, storage, and user feedback (toasts)
- POS device capabilities (scanner, camera, printer, etc.)

The APIs available to an extension depend on its target and context. Many APIs are reactive and can update the extension when relevant POS data changes.

### Web Components

Web Components provide the UI building blocks used to create the extension interface — buttons, text, forms, lists, layouts, tiles, blocks, and other POS interface elements. Availability depends on the target.

**Key idea:** POS UI Extensions combine Targets, Target APIs, and Web Components to provide custom functionality inside Shopify POS.

---

## 4. POS UI Extensions Architecture

```
                 ┌──────────────────┐
                 │    Shopify POS   │
                 │   iOS / Android  │
                 └────────┬─────────┘
                          │
              ┌───────────┴───────────┐
              │        Target         │
              │                       │
              │ Tile / Action / Block │
              │  / App Background     │
              └───────────┬───────────┘
                          │
             ┌────────────┴───────────┐
             │                        │
      ┌──────▼───────┐         ┌──────▼────────┐
      │ Target APIs  │         │ Web Components│
      │              │         │               │
      │ Cart         │         │ Buttons       │
      │ Customer     │         │ Text          │
      │ Product      │         │ Forms         │
      │ Order        │         │ Layout        │
      │ Storage      │         │ Other UI      │
      └──────────────┘         └───────────────┘
```

The extension runs within Shopify POS and uses the APIs and UI components provided by Shopify.

### Extension-only vs server-hosted apps

POS UI Extensions can be built as either extension-only apps or as part of an app with a server-hosted backend.

#### Extension-only apps

An extension-only app can run entirely on the merchant's device without requiring a developer-hosted backend.

This approach is suitable when:

- All required functionality can run inside the POS extension
- The extension does not require external services or secrets
- No server-side business logic is required
- The extension can work with Target APIs and, where needed, Direct Admin GraphQL access from the device

#### Server-hosted apps

A server-hosted app uses a backend when the extension requires functionality that cannot or should not run entirely on the merchant's device.

A backend may be used for:

- Server-side business logic
- External or third-party services
- Storing application data and secrets
- Sensitive business logic
- Communication with external systems
- Shopify API operations beyond what the extension can access directly

**Key idea:** A POS UI Extension does not always require a backend. An extension-only app can operate entirely on the merchant's device. Use a server-hosted architecture when the app requires backend services, external integrations, or additional processing.

---

## 5. POS UI Extensions in Practice

POS UI Extensions are integrated directly into Shopify POS and are used by merchants to access additional functionality during their normal POS workflows.

They typically:

- Render UI inside supported POS targets
- Allow merchants to interact with app functionality
- Access relevant Shopify POS data through Target APIs
- Use Shopify-provided Web Components for the interface
- Communicate with an app backend when additional server-side functionality is required

### Example use cases

- Custom discount tools
- Loyalty and rewards functionality
- Customer information and loyalty points
- Product information and inventory alerts
- Barcode and QR code scanning
- Custom printing workflows
- Custom sales, return, and exchange workflows

### Example flow: custom discount extension

1. Merchant opens Shopify POS
2. Merchant selects the app's tile or action
3. The extension opens a custom workflow
4. The extension reads the relevant cart information
5. Available discounts are displayed
6. The merchant selects a discount
7. The extension applies the appropriate action to the cart
8. The extension provides feedback to the merchant

---

## 6. How POS UI Extensions Work Together

POS UI Extensions are often one part of a larger Shopify app. They can work together with:

| Surface | Role |
|---|---|
| **App Admin** | Where merchants configure app settings |
| **Backend** | Server-side business logic and external integrations |
| **Shopify APIs** | App data and Shopify resources (Admin GraphQL, webhooks) |
| **Other app surfaces** | Theme app extensions, checkout extensions, etc. |

### Example flow: loyalty extension

1. Merchant configures loyalty rules through the app admin
2. POS UI Extension displays loyalty information on the customer screen
3. Extension accesses relevant customer or cart data via Target APIs
4. Backend calculates or retrieves loyalty data when required
5. POS UI updates with the relevant information
6. Shopify webhooks keep external loyalty data synchronized

**Key idea:** POS UI Extensions act as the POS-facing UI layer of an app. Other app surfaces and backend services provide configuration, business logic, and data management.

---

## 7. Key Takeaways

- POS UI Extensions extend the Shopify Point of Sale experience
- They allow apps to add custom functionality without modifying Shopify POS
- They are built around **Targets**, **Target APIs**, and **Web Components**
- Targets determine where an extension appears (Tile, Action, Block, App background, Event observe)
- Target APIs provide access to POS data and functionality
- Web Components provide the UI building blocks
- A backend is optional — required only when server-side functionality is needed
- POS UI Extensions can work together with other Shopify app surfaces
- They provide a native, merchant-friendly way to extend Shopify POS

---

## Related docs

| Document | Audience |
|---|---|
| [Developer Playbook](./POS-UI-EXTENSIONS-GUIDE.md) | Developers building extensions |
| [Shopify POS UI extensions reference](https://shopify.dev/docs/api/pos-ui-extensions/latest) | Official API reference |
| [Getting started tutorial](https://shopify.dev/docs/apps/build/pos/getting-started) | Official hands-on tutorial |
