# POS UI Extensions — Developer Guide

Hands-on reference for building POS UI Extensions. For concepts and architecture, see [POS UI Extensions — Overview](./POS-UI-EXTENSIONS-OVERVIEW.md).

---

## 1. When to use POS UI Extensions

Use POS UI Extensions when building Shopify app features that:

- extend the Shopify Point of Sale (POS) interface
- add custom functionality to POS workflows
- add interactive tiles to the POS smart grid
- add actions, menu items, or modals to supported POS surfaces
- display custom information inside supported POS screens
- interact with cart, customer, product, and order data
- require access to supported POS device capabilities
- need functionality to run directly on the merchant's POS device
- require custom POS functionality without modifying Shopify's POS application

Each feature should be mapped to a POS target and its supported APIs before implementation starts.

---

## 2. Prerequisites

Before implementing POS UI Extensions:

- Shopify Partner account
- Shopify development store
- Shopify CLI installed
- Shopify app created with `shopify app init`
- Shopify app authenticated
- Shopify POS installed on a supported iOS or Android device (no dedicated POS hardware required)
- Basic knowledge of JavaScript/TypeScript and Preact
- Understanding of Shopify app development
- Understanding of Shopify POS workflows

A backend is not required for every POS UI Extension. An extension-only app can run without a developer-hosted backend when all required functionality can run within the extension — including Target APIs and Direct Admin GraphQL access where supported.

---

## 3. Creating a POS UI Extension

A POS UI Extension can be created as part of an existing Shopify app or as an extension-only app.

### Extension-Only App

For an extension-only app, Shopify CLI can create the initial app structure with:

```
shopify app init
```

When prompted, choose:

**Build an extension-only app**

An extension-only app contains the extension code and does not require a developer-hosted backend.

### Generate the Extension

Inside the app project, generate the POS UI Extension with:

```
shopify app generate extension
```

Shopify CLI then prompts you to select the extension type and generates the required configuration and source files.

For example, selecting **POS smart grid** creates the files required for a smart-grid tile and its related workflow. Other POS templates include **POS action** (menu item + modal) and **POS block** (inline content on a screen).

### Local Development

Preview the extension on a device with:

```
shopify app dev
```

Press `p` to open the Dev Console, then scan the QR code on your iOS or Android device logged into your dev store.

---

## 4. Extension Configuration

POS UI Extensions are configured through a `shopify.extension.toml` file.

This file defines important information about the extension, including:

- API version
- Extension type
- Extension name
- Extension handle
- Extension UID
- Extension description
- Targets
- Source modules
- Optional supported features

A simplified example is:

```
api_version = "2026-07"

[[extensions]]
type = "ui_extension"
name = "My POS UI Extension"
handle = "my-pos-ui-extension"
uid = "..."                              # CLI-generated; required for deploy
description = "My POS UI extension"

[extensions.supported_features]
runs_offline = true                      # optional; POS 11.0+

[[extensions.targeting]]
target = "pos.home.tile.render"
module = "./src/Tile.tsx"
```

The `[[extensions.targeting]]` section connects a specific POS target to the file containing the extension code.

The `name` and `description` fields can use localization keys (e.g. `t:name`) defined in `locales/en.default.json`.

Required access scopes for Direct Admin GraphQL are declared in `shopify.app.toml` at the app level. Scopes apply after deploy and reinstall on the dev store.

---

## 5. Choosing and Configuring Targets

Targets determine where the extension runs inside Shopify POS.

The target is configured in `shopify.extension.toml`.

For example:

```
[[extensions.targeting]]
target = "pos.home.tile.render"
module = "./src/Tile.tsx"
```

A second target can be configured for a modal:

```
[[extensions.targeting]]
target = "pos.home.modal.render"
module = "./src/Modal.tsx"
```

The target determines both the location of the extension and the capabilities available to it.

### Tile Targets

A tile target is used to add an interactive tile to the POS smart grid.

Example:

```
POS Smart Grid
┌──────────────┐
│  My Discount │
│     App      │
└──────────────┘
```

A tile can trigger another action, such as opening a modal via `shopify.action.presentModal()`.

### Action Targets

Action targets provide interactive entry points into POS workflows.

They typically come in pairs:

- **Menu item** — renders a button in an action menu (e.g. `pos.product-details.action.menu-item.render`)
- **Modal** — renders the full-screen workflow launched from that button (e.g. `pos.product-details.action.render`)

A modal is useful when the workflow requires more space or multiple interactions.

### Block Targets

Block targets render custom content inside supported POS screens.

They are useful when information should appear directly within an existing POS workflow.

### App Background

The app background target (`pos.app.ready.data`, API 2026-07+) runs without rendering UI and remains active during the POS session.

It can be used for functionality such as:

- Transaction synchronization
- Cash tracking
- Session-level state
- Responding to POS host events via `shopify.addEventListener()`

App background extensions are currently observation-only and cannot mutate POS state.

### Event Observe Targets

Event observe targets react to POS lifecycle events without rendering UI. Examples include:

- `pos.transaction-complete.event.observe`
- `pos.cart-update.event.observe`
- `pos.cash-tracking-session-start.event.observe`
- `pos.cash-tracking-session-complete.event.observe`

---

## 6. POS UI Extension Project Structure

A typical POS UI Extension contains configuration, source code, and optional localization files.

Example:

```
my-app/
│
├── extensions/
│   └── my-pos-ui-extension/
│       ├── src/
│       │   ├── Tile.tsx
│       │   └── Modal.tsx
│       │
│       ├── locales/
│       │   ├── en.default.json
│       │   └── fr.json
│       │
│       ├── shopify.extension.toml
│       └── package.json
│
├── shopify.app.toml
└── package.json
```

---

## 7. Building the UI with Web Components

Current POS UI Extensions use Shopify's Web Components to build the interface.

Web Components are native UI elements designed to:

- Follow Shopify's design system
- Provide consistent POS experiences
- Support accessibility
- Render optimized interfaces
- Work across supported iOS and Android POS devices

The components available to an extension depend on its target. For example, a tile target can render a tile component, while other targets support different components.

Common components include:

- Buttons
- Text
- Links
- Clickable elements
- Forms
- Lists
- Tiles
- Layout components (e.g. `s-page`, `s-scroll-box`, `s-box`)

Modals are not a standalone component — they are launched with the Action API (`shopify.action.presentModal()`), and the modal target renders UI using layout components such as `s-page`.

Example:

```jsx
import { render } from 'preact';

export default async () => {
  render(<TileComponent />, document.body);
};

function TileComponent() {
  return (
    <s-tile
      heading="My App"
      subheading="Open app"
      onClick={() => {
        shopify.action.presentModal();
      }}
    />
  );
}
```

The `s-tile` component provides the UI for the POS tile, while the Action API is used to present the modal.

Web component attributes use camelCase (e.g. `paddingBlock`, `alignItems`). The `shopify` global should be declared in ESLint config as `readonly` to avoid lint errors.

---

## 9. Target APIs

Target APIs provide access to Shopify POS data and functionality.

Shopify automatically provides APIs based on the target where the extension runs.

This means that developers do not receive unrestricted access to every POS API. The available APIs depend on the extension's location and use case.

Target APIs can be grouped into three categories.

### 9.1 Contextual APIs

Contextual APIs provide information related to the current POS workflow.

Examples include:

- Cart API
- Cart Line Item API
- Customer API
- Draft Order API
- Order API
- Product API

For example, the Cart API can be used to add, remove, and modify cart items and apply supported discounts.

### 9.2 Platform APIs

Platform APIs provide access to POS device capabilities.

Examples include:

- Camera
- Cash Drawer
- Connectivity
- Device
- Navigation
- PinPad
- Printing
- Scanner
- Storage

These APIs allow extensions to interact with the physical POS environment and device capabilities.

Note: the legacy Print API is deprecated; use the Printing API instead.

### 9.3 Standard APIs

Standard APIs provide functionality commonly needed by POS extensions.

Examples include:

- Action API
- Locale API
- Product Search API
- Session API
- Toast API

These APIs support actions such as navigation, product searching, authentication, localization, and merchant feedback.

For the full list of APIs available per target, see the [Target APIs reference](https://shopify.dev/docs/api/pos-ui-extensions/latest/target-apis).

---

## 11. Accessing Shopify Data

POS extensions can access Shopify data through the APIs available to them.

The appropriate approach depends on the type of information or operation required.

### Target APIs

Use Target APIs for POS-specific contextual functionality.

Examples:

- Current cart
- Current customer
- Selected product
- Current order
- POS device functionality

### Direct Admin GraphQL

The extension can query or mutate Shopify data directly from the device without a backend round trip:

```jsx
const response = await fetch('shopify:admin/api/graphql.json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `query { shop { name } }` }),
});
```

Requirements:

- Required access scopes declared in `shopify.app.toml`
- Deploy and reinstall on the dev store for scopes to apply
- POS app 10.6.0+ and extension API 2025-07+

This approach is suitable for extension-only apps that need Shopify Admin data.

### App Backend

A backend should be used when the application requires:

- External APIs
- Third-party services
- Secrets
- Sensitive business logic
- Server-side processing

Relative URLs (e.g. `fetch('/api/loyalty/...')`) resolve against `application_url` in `shopify.app.toml`. Auth headers are injected automatically for requests to the app domain (POS 10.6.0+). The Session API can provide tokens for custom backend authentication.

The choice between Target APIs, Direct Admin GraphQL, and a backend depends on the operation and the app's architecture.

---

## 14. Working with POS Device Capabilities

POS UI Extensions can interact with supported POS hardware and device capabilities through Platform APIs.

**Scanner API**

Used to capture:

- Barcodes
- QR codes

**Camera API**

Used to capture photos using the POS device camera.

**Printing API**

Used to discover connected receipt printers and print documents.

**Cash Drawer API**

Used to open connected cash drawers where supported.

**PinPad API**

Used to display a modal PIN pad for secure PIN entry and validation.

**Connectivity API**

Used to check device and internet connectivity status. Especially important when using `runs_offline = true`.

**Device API**

Provides information about the POS device and its capabilities.

**Navigation API**

Used to navigate between screens within the POS interface.

**Storage API**

Used to store and retrieve extension data locally (up to 100 entries per extension).

These capabilities allow extensions to build experiences that are specific to physical retail environments.

When `runs_offline = true` is set in `shopify.extension.toml`, only a subset of Platform APIs and targets function without network access.

---

## 22. Deployment

Once the extension has been developed and tested, it can be deployed using Shopify CLI.

The main deployment command is:

```
shopify app deploy
```

Deployment creates a new app version containing the extension changes.

Before deployment, developers should verify:

- Configuration
- Target definitions
- API version
- UI behavior
- Error handling
- Device compatibility
- Performance
- Localization
- Backend communication
- Bundle size (max 64 KB per extension — enforced at deploy)

Test locally with `shopify app dev` on a real iOS or Android device before deploying.

Shopify's deployment process packages the extension and validates the compiled bundle before deployment.

---

## Related docs

- [POS UI Extensions — Overview](./POS-UI-EXTENSIONS-OVERVIEW.md)
- [Official POS UI extensions reference](https://shopify.dev/docs/api/pos-ui-extensions/latest)
- [Getting started tutorial](https://shopify.dev/docs/apps/build/pos/getting-started)
