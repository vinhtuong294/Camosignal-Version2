# Collection recommendations

Implemented below the existing Product recommendations section on the default and pre-order product templates. Editor name: **Collection cross-sell**. Default storefront heading: **Pairs Well With**.

Preview theme: **155584692415**, `CamoSignal collection recommendations 2026-09-17` (unpublished).

## Rules

| Source collection | Target collection quotas |
| --- | --- |
| T-Shirts, Pocket Tee, Game Day Jersey | 4 Long Sleeves + 4 Hoodies |
| Long Sleeves | 4 Hoodies + 2 T-Shirts + 2 Pocket Tee |
| Hoodies | 4 Long Sleeves + 2 T-Shirts + 2 Pocket Tee |
| Sweatshirts | 4 Hoodies + 4 Long Sleeves |
| Youth Tees | 4 Hoodies + 2 T-Shirts + 2 Pocket Tee |
| Fleece Hoodie | 4 Curated Sets + 4 UV Hoodies |
| Curated Sets | 4 UV Hoodies + 4 Waterproof Jacket |
| UV Hoodies | 4 Curated Sets + 4 Waterproof Jacket |
| Waterproof Jacket, Hats, Beanie | 4 Curated Sets + 4 Fleece Hoodie |

Collection settings can be changed in the editor. Membership determines both source and candidate eligibility; product type is never used. Specific groups precede generic T-Shirts, including Pocket Tee, Jersey and Youth. Pocket Tee uses the new `pocket-tee` collection, not `hunting-pocket-tee`.

Candidate metadata is paginated from only the permitted target collections. Candidates must also belong to at least one of the current product's collections, ordered smallest to largest by `all_products_count`, excluding `new-arrival`, `new-arrivals`, `best-seller`, and `best-sellers`. Each target quota is filled from the smallest collection first, advancing through the second, third, fourth and later collections only for missing slots. A candidate belonging to multiple collections is assigned its earliest collection priority and selected only once. Within that priority, matching `design:` tags (or matching product handle design stems), shared non-type collections and collection order break ties. Smaller-collection matches are not displaced by matching designs from broader collections. If a target quota cannot be met after all related collections are considered, remaining slots may be borrowed from the other permitted target groups, again preferring smaller collections. No eligible collections means no cards; fewer than eight are allowed only when eligible candidates are exhausted. Slots are interleaved. Current products, unavailable/nonphysical products, duplicates and all products already present in the existing recommendation block are excluded. Existing recommendations are observed for asynchronous updates and exclusions are rechecked immediately before cards are inserted.

Native `product-card` snippets provide the same images, prices, badges, color swatches and links. Scoped appearance styles were copied unchanged from the current recommendation section; its file was not modified. Loading starts near the section and uses bounded request concurrency. Theme editor reconnects destroy sliders/observers before reinitialization.

## Validation

September 18 Pairs Well With carousel navigation:

- Matched You Might Also Like: 4 cards per group at desktop, 3 at tablet, 2 at mobile; rewind enabled. Removed the tablet fractional 3.2-card view.
- Browser at 1280px: Next changes active index 0 to 4, then 4 to 0. At 390px: second pagination button changes index 0 to 2, cards are 163.5px wide, no horizontal page overflow. Mobile keeps the same pagination-only controls as the upper section. Temporary viewport override reset after testing.
- Shopify Liquid validation passed (`pairs-carousel-validation.txt`). Uploaded only `sections/collection-recommendations.liquid` to draft theme 155584692415.

September 18 upper-section upsell exclusion:

- `You Might Also Like` now includes Flex product-page upsell widgets and legacy `lb-product-handle` cards in its exclusion set. Removed the old exemption for `related` collection recommendations.
- The observer handles delayed widget insertion and changes to product links/handle attributes. Liquid renders up to 16 candidates for the configured 8 active slots, allowing the existing rebalance logic to promote reserves after duplicate removal.
- All 3 tests in `upsell-exclusion.test.cjs` passed, exercising actual extraction/filter/rebalance functions with Flex duplicates, delayed updates, reserve promotion, and legacy handle-only cards. Shopify Liquid validation passed; see `upsell-exclusion-validation.txt`.
- Uploaded only `sections/product-recommendations.liquid` to draft theme 155584692415. Browser check on `if-its-brown-its-down-t-shirt`: 8 active upper cards, 8 reserves, no overlap with the 3 upsell products; Pairs Well With has 8 cards and no overlap with the upper section.

Latest September 18 progressive-collection update:

- All 12 rule tests passed. Added coverage for advancing to collections 3 and 4, stopping once quotas are met, preserving earlier matches against later matching designs, and exhausting related collections before borrowing another group's slots.
- The two-collection cap was removed only from Pairs Well With; the upper section is unchanged.
- Shopify Liquid validation passed (see `collection-progressive-validation.txt`). Uploaded only the updated section to draft theme 155584692415.
- Browser preview on `one-breath-away-long-sleeve` now exposes all 7 eligible collections in ascending size order and renders 8 products: 4 Hoodies, 2 T-Shirts, 2 Pocket Tee; no overlap with the upper section.

September 18 collection-filter update:

- All 9 rule tests passed, including strict collection intersection, matching-design rejection outside the intersection, exclusion of all 8 upper cards, and empty/short collection results.
- Updated section passed Shopify Liquid validation; see `collection-filter-validation.txt`.
- Long Sleeve preview (`one-breath-away-long-sleeve`): selected collections `deer-hunting-hoodie`, `deer-hunting-new`; 4 Hoodies + 2 T-Shirts + 2 Pocket Tee; zero duplicates with the 8 upper cards. Layout remains unchanged.
- Waterproof preview (`instinct-on-camo-water-resistant-jacket`): selected collections `waterproof-jacket`, `hunting-apparel`; 4 Curated Sets + 4 Fleece Hoodies; zero duplicates with the 8 upper cards.
- Uploaded only `sections/collection-recommendations.liquid` to draft theme 155584692415.

Original implementation verification (before the stricter collection filter):

- `node --test qa/collection-recommendations-2026-09-17/rules.test.cjs`: 7 tests passed, including every approved source rule, overlapping memberships, custom collection handles, exact quotas, design/theme ranking, duplicates and shortages.
- Shopify Liquid skill validator: 7 files passed, revision 3. See `liquid-validation.txt`. Telemetry disabled; validation used the locally cached Shopify schemas.
- Browser preview, Long Sleeves: 4 Hoodies + 2 T-Shirts + 2 Pocket Tee; same-design hoodie first; no duplicate with the original section.
- Browser preview, Combo: 4 UV Hoodies + 4 Waterproof Jacket, with matching-design UPF hoodie first.
- Browser preview, Hat: 4 Curated Sets + 4 Fleece Hoodie.
- Desktop: old and new card widths both 275.25px, heading sizes both 36px. Next arrow moves the new slider independently.
- Mobile at 390px: old and new card widths both 163.5px, heading sizes both 25px, two cards per view, working grouped pagination, no document horizontal overflow. Heading shortened to fit the original mobile heading treatment.

## Deployment scope

The preview is a copy of the live theme with only the seven feature files overlaid. Production theme **153669173439** was not modified. The workspace contains unrelated pre-existing changes; do not deploy the entire workspace to production. For any subsequent deployment, pull current production templates first, merge the new section/settings/order, and upload only the feature files.

Files: `sections/collection-recommendations.liquid`, `snippets/collection-recommendations-styles.liquid`, `snippets/collection-recommendation-product.liquid`, `templates/collection.cross-sell-candidates.liquid`, `templates/product.cross-sell-card.liquid`, `templates/product.json`, `templates/product.pre-order.json`.
