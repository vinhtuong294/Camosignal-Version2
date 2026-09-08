# Camo Signal product listing automation

This module lives inside the existing Shopify embedded app at `/app/listing`. It never publishes products: every successful run creates a **Draft** product.

## What it does

1. Reads rows from Lark Base table **TUONG - UPLOAD**.
2. Uses the linked **Weekly Design Plan** record as the fallback product name and as collection context.
3. Downloads the Lark attachment field directly. Attachments may be JPG, PNG, WEBP, or a ZIP containing those images.
4. Scores existing Shopify products with the same product type, then lets the operator confirm the template in the preview.
5. Duplicates the template as a Draft, clears the description, applies optional Lark tags/metafields, and rebuilds color and size variants.
6. Uploads the new images and attaches each color's media to every matching color variant.
7. Replaces the product collection with the confidently inferred collection, writes the Shopify Admin URL back into Lark, and stores a local audit log.

`UPF Hoodie` is treated specially: it must use an old UPF Hoodie template with no Color option. The new product keeps the template's non-color variants, but changes only title and images.

## Required Lark fields

The labels below match the screenshot. The label may be changed through the matching `LARK_FIELD_*` environment variable.

| Field | Lark type | Required | Purpose |
| --- | --- | --- | --- |
| `Design ID` | Text | Yes | Audit identity and image filename prefix. |
| `Product type` | Single select/Text | Yes | Finds compatible template. |
| `Main Color` | Single select | Recommended | Main color and fallback color value. |
| `Colors` | Multi-select | Yes for colored products | Full color list to create. |
| `Weekly Design Plan` | Link to record | Recommended | Product-name fallback and collection inference. |
| `Shopify URL` | URL | Yes | Updated after a draft succeeds. |
| `Assets` | Attachment | Yes | One ZIP or individual images. Add this column to TUONG - UPLOAD. |
| `Product name` | Text | Optional | If blank, the linked plan title is used. |
| `Price` | Number/Currency | Optional | One price applied to every generated variant. Blank keeps the template price. |
| `Inventory` | Number | Optional | One inventory amount applied to every generated variant at the configured location. Blank defaults to 100 per variant for new products. |
| `Tags` | Multi-select/Text | Optional | Comma-separated values that replace tags copied from the template. Blank preserves template tags. |
| `Metafields` | Long text | Optional | JSON array of individual metafields to update; all other template metafields are preserved. |

The Weekly Design Plan table needs a title field. Set `LARK_WEEKLY_PLAN_TITLE_FIELD` to its exact name when it is not `Product name`.

## Asset naming rule

For color products, every image filename must contain one of the Lark color labels. The preview blocks draft creation when an image cannot be matched.

```text
TURKEY10080__White__01.jpg
TURKEY10080__Heather Dark Green__01.jpg
TURKEY10080__Heather Dark Green__02.jpg
```

For a colorless UPF Hoodie, color text is not needed in the filename.

## Lark setup

Create an internal Lark custom app, enable Lark Base/Bitable access plus Drive/attachment download access, then grant that app access to the Base. Put its App ID, App Secret, Base app token and table IDs in a local `.env` file. Do not paste secrets into source control or chat.

```dotenv
LARK_APP_ID=
LARK_APP_SECRET=
LARK_BASE_APP_TOKEN=
LARK_UPLOAD_TABLE_ID=
LARK_WEEKLY_PLAN_TABLE_ID=
```

If you do not want Lark title or status fields to use the defaults, copy the optional `LARK_FIELD_*` entries from `.env.example` and point them to your exact labels.

## Shopify setup

The app now requires these scopes:

```text
read_products,write_products,read_inventory,write_inventory,read_locations,write_app_proxy
```

After deployment, reinstall or reauthorize the Shopify app so the new scopes take effect. A person creating the draft must also have Shopify permission to duplicate/create products and update inventory.

To use the optional `Inventory` Lark column, choose the stock location deliberately and set it:

```dotenv
SHOPIFY_INVENTORY_LOCATION_ID=gid://shopify/Location/123456789
```

The module intentionally refuses to change inventory without this location, rather than guessing a warehouse.

## Collection rules

Collection scoring uses the product name, product type, Design ID and linked Weekly Design Plan. It currently recognizes `Turkey`, `Deer`, `Saltwater`, `Freshwater`, `Fishing`, `National Park`, `Game Day`, `Spooky`, and `Faith` in a matching collection title or handle. If it cannot determine a confident collection, **Create Draft** stays disabled; update the Weekly Design Plan title or product name first.

## Run locally

```powershell
cd E:\PROJECTS\CAMOSINGAL-ver2\flex-cart-upsell
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open `/app/listing`, click **Sync Lark**, select a row, inspect the preview, choose the template if needed, and click **Create Draft in Shopify**. Do not deploy or run the migration against production until the first few drafts have been checked manually.

## Important data behavior

- Product description is set to empty by design.
- Blank `Tags` preserves template tags. A non-empty `Tags` column replaces them, so include every desired tag there.
- `Metafields` updates only the named fields and preserves all other template metafields. Use this JSON shape: `[ { "namespace": "custom", "key": "sold_base", "type": "number_integer", "value": "100" } ]`.
- The selected collection replaces template collection membership so the new product is not left in a wrong collection.
- Listing runs are written to the `ListingRun` table for audit and error recovery.
- A failed media upload can leave a Shopify Draft behind. The audit log records its ID when Shopify had already created it; review that Draft rather than automatically deleting it.
