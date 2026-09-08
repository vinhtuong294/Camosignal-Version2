# CamoSignal Insight Engine V2

Long-term dashboard rebuild for CamoSignal POD analytics. This version is intentionally separate from the legacy single-file app so the UI, data model, Shopify bridge, and future AI decision layer can evolve cleanly.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Apache ECharts via `echarts-for-react`
- Roboto font

## Run Locally

```bash
npm install
npm run dev -- --port 4312
```

Open `http://localhost:4312`.

## What V2 Adds

- POD Decision Center with Scale, Watch, and Cut Traffic lanes.
- Product images shown directly beside product names.
- Product detail sheet with listing age, product type, theme, design family, collections, tags, and classification confidence.
- KPI cards, revenue trend, calendar heatmap, product type bars, season/theme table, and source coverage.
- Tooltip-enabled charts so revenue, orders, and deltas are visible on hover.
- Cleaner black-on-white UI with forest green action states and Roboto typography.

## Data Bridge

`src/app/api/insights/route.ts` exposes:

- `GET /api/insights` for local sample data.
- `GET /api/insights?source=shopify&days=14` for live Shopify Admin API data when env is configured.
- `POST /api/insights` to forward payloads to the legacy insight API.

Set these when you want V2 to read Shopify directly:

```bash
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_SCOPES=read_orders,read_products,read_customers,read_reports
SHOPIFY_STORE_DOMAIN=apepsd-ha.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=...
SHOPIFY_API_VERSION=2026-04
```

The preferred production path is the OAuth/session-token path: when V2 is opened inside Shopify Admin, the browser calls `window.shopify.idToken()`, sends that token to `/api/insights`, and the API exchanges it for an offline Admin token. `SHOPIFY_ADMIN_ACCESS_TOKEN` is only a local/service fallback.

The live bridge reads Shopify orders, line items, product images, product type, collections, tags, description, inventory quantity, and listing dates, then maps them into the V2 dashboard schema.

The Overview growth funnel also uses:

- ShopifyQL `sessions`, filtered to `human_or_bot_session = 'human'`, for daily human Online Store sessions. The query uses `WITH TIMEZONE` with the validated Shopify shop IANA timezone, matching the date-range boundaries. This requires `read_reports` plus Shopify approval for the protected customer data used by `shopifyqlQuery`.
- Distinct customer IDs on reportable orders for unique buyers. The buyer snapshot follows the selected sales-channel filter, while the website funnel always matches popup signups only to Online Store purchases. Orders without a customer ID remain a separate guest/unmatched-order count.
- Customers tagged `popup` for the popup audience and the `Deer`, `Turkey`, `Freshwater`, `Saltwater`, and `Seasonal` interest segments. The period cohort contains only popup-tagged customers whose observed signup timestamp falls inside the active date filter. Interest-segment membership is multi-select, so those shares use all period popup signups as their denominator and are not expected to sum to 100%. Selection-depth groups (exactly one, exactly two, or three-plus recognized options) use period signups with at least one recognized option as their denominator; zero-option signups are disclosed separately.

Period popup signups are explicitly estimates: the bridge uses the email consent `marketingUpdatedAt` timestamp only while consent is `SUBSCRIBED` or `PENDING`, otherwise it falls back to the customer's `createdAt`. This avoids treating a later unsubscribe update as a new signup. Cohort buyers, orders, revenue, purchase rate, and AOV always use reportable Online Store orders inside the selected period and at or after the observed signup timestamp. Cohort revenue retains the current order-total basis used by the buyer snapshot, while cohort AOV matches the dashboard headline formula: qualifying current subtotal sales (falling back to order total when subtotal is unavailable) divided by qualifying orders. If order pagination is incomplete, these purchase metrics remain unavailable rather than reporting partial values. Shopify customer tags are current-state attributes, not historical snapshots, so interest and selection-depth groups reflect the customer's recognized tags now rather than necessarily what they selected at signup. Existing OAuth installs must reconnect once after adding `read_reports`; missing report/customer permissions degrade only the growth coverage fields and do not stop the rest of the Shopify analysis from loading. The paginated popup audience is cached per shop for five minutes to keep date-filter refreshes responsive.

## Meta Ads Google Sheet

`GET /api/meta-ads` reads the private Meta Ads Sheet on the server, normalizes the rows with the same parser used by CSV/JSON upload, and returns data only to an authenticated Shopify session in production. The Ads view syncs this endpoint automatically while keeping manual upload as a browser-local fallback.

The configured workbook is `CAMO - DATA ADS FINAL`, tab `Platform_Data` (`gid=362684494`). To grant the app read-only access:

1. Enable the Google Sheets API in a Google Cloud project.
2. Create a service account and share only this spreadsheet with its `client_email` as Viewer.
3. Base64-encode the downloaded service-account JSON and add it to Vercel as `GOOGLE_META_ADS_SERVICE_ACCOUNT_JSON_B64`.
4. Add the remaining `GOOGLE_META_ADS_*` values from `.env.example`, then redeploy.

The service-account JSON, private key, and OAuth token remain server-side. Normalized Ads rows are returned only to an authenticated Shopify client, kept in React memory, and are not persisted to browser storage by the automatic Sheet sync. Never use a `NEXT_PUBLIC_` prefix for credential values. If preferred, configure `GOOGLE_META_ADS_CLIENT_EMAIL` and `GOOGLE_META_ADS_PRIVATE_KEY` instead of the base64 JSON variable.

Set these only when you want V2 to fall back to the legacy insight backend:

```bash
LEGACY_INSIGHTS_API=https://shopify-insight-engine.vercel.app/api/insights
LEGACY_INSIGHTS_KEY=...
```

## Current Scope

This is the professional V2 shell, analytical UI layer, live Shopify Admin data bridge, and private Google Sheets Meta Ads bridge. Meta rows enrich the Ads workspace; broader cross-tab Meta attribution and AI decision automation remain future work.
