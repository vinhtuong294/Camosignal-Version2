# Shopify-native upsell recovery

The opt-in configuration is the merchant-owned SHOP JSON metafield
`camosignal_upsell.storefront_config`. Storefront API access is **NONE**;
Liquid embeds only non-sensitive display settings. Never put credentials here.

Version 1 stores `placements.PRODUCT_PAGE` and `placements.CART_DRAWER` with
enabled, maxProducts, appearance and discount settings. Existing discount
Functions and `_flex_upsell_campaign` line properties are unchanged.
Shopify related products plus the best-sellers collection replace the app's
database-backed ranking for opted-in placements. Native mode deliberately does
not record VIEW/CLICK/ADD analytics in Neon; old metrics remain historical.

`previewThemeId` limits activation to a QA theme bearing a matching
`<meta name="camosignal-upsell-preview-theme" content="...">` marker.
Remove that field only after validating the preview. Missing/invalid config
leaves the existing backend path in place. `enabled:false` hides a placement.
Removing the entire config rolls back the recommendation source (the old
backend still needs a healthy database).

Required theme files: `snippets/cart-upsell-product-metadata.liquid`,
`templates/product.cart-recently.liquid`, `templates/collection.cart-recently.liquid`.
Missing/invalid metadata fails closed so customize products cannot be quick-added.
Public product variants are fetched from Shopify with a 60-second in-page cache;
Shopify remains authoritative when adding to cart.

Admin campaign saves mirror an already opted-in placement only after discount
sync succeeds. Database-dependent admin features still require Neon; this is
not a migration of sessions, history, or the app's entire database.

## Deploying schema changes

`vercel-build` generates Prisma and builds assets; it does not connect to Neon.
For any future Prisma schema migration, run `npm run setup` against the intended
database and verify it before releasing the dependent application code.
No Prisma schema changes or data deletions are part of this recovery.

## Order tagging

The database-backed orders/create webhook cannot tag while Neon is suspended.
Use Shopify Flow: Order created → at least one line item → at least one of its
customAttributes with key `_flex_upsell_campaign` AND value in PRODUCT_PAGE,
CART_DRAWER, CART_PAGE → Add order tags `upsell`. Verify both positive and
negative test events before activation. Do not add tags to every order.

## Production recovery — 2026-09-14

- Live theme: `153669173439` (`camosignal-version2`). Only the three metadata
  files above were pushed; layout and theme settings were not overwritten.
- App extension release: `camosignal-upsell-37`.
- Vercel deployment: `dpl_CSZnMw8vAMJ3tMRC1b34KGtqoUue`, promoted to
  `https://camosignal-upsell.vercel.app` after build and HTTP 200 verification.
- The preview-only gate was removed from the existing SHOP metafield using
  compareDigest. Product-page limit is 3 and drawer limit is 5.
- Shopify Flow `CamoSignal — Tag upsell orders` is enabled. Workflow ID:
  `01a09e46-fd91-7344-95c3-005e26c8d55d`. Configuration-preview tests returned
  false for a non-upsell order and true for an existing upsell order; the true
  action resolves the triggering order ID and tag `upsell`. No checkout or
  new order was created as part of verification.
- Real Shopify QA verified product-page add, drawer size M add, existing
  buy-more discount, and removal of only QA items. The cart was restored to
  its original four items. Live mobile verification showed five recommendations,
  two complete 166px cards in a 342px section, and enabled back/next navigation.
- Neon sessions/admin and historical dashboard access still depend on the
  suspended database. Native storefront recovery does not remove that limit
  or guarantee unlimited free usage. No database or historical data was deleted.
