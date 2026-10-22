# Matching-design discounts

This dependency-free Node 24 task maintains native Shopify codes for products
sharing a nonempty `design:` tag. Each code takes 15% off its matching products
when the cart contains at least two matching units. Two units of the same product
also qualify. Different designs receive different codes; Shopify still limits
the number of discount codes accepted on a cart.

The task reuses the installed **Camo Signal Listing** app on
`apepsd-ha.myshopify.com`. It requires product read access and `write_discounts`.
It never creates collections, changes product tags, or changes product prices.
It needs no Vercel deployment, database, additional Shopify app, or open computer.

## Activation

1. Approve `read_discounts` and `write_discounts` for the existing Listing app while preserving its
   current scopes. No new app or credential rotation is required.
2. Store that app's client ID and client secret in this repository's encrypted
   Actions secrets, named `DESIGN_SHOPIFY_CLIENT_ID` and
   `DESIGN_SHOPIFY_CLIENT_SECRET`. Never commit credentials or access tokens.
3. Manually run **Sync design discounts** with `test_only` and `apply` left false. Review the
   summary, scope checks, and any proposed changes. To test the runner without
   connecting to Shopify, select `test_only` instead.
4. Run once with `apply` true and verify the resulting native codes and products.
5. Enable new-design recognition in the storefront theme and verify cart behavior.
6. Set the repository Actions variable `DESIGN_SYNC_ENABLED` to `true`.

The workflow is disabled for scheduled writes until step 6. It runs every two
hours at minute 23 UTC (every two hours at minute 23 in Bangkok as well).
GitHub can delay scheduled runs. In public repositories, GitHub automatically
disables schedules after 60 days without repository activity; re-enable the
workflow in Actions if that happens. A successful scheduled job by itself should
not be treated as a guarantee that this inactivity rule will never apply.
Manual runs use the same concurrency group so
two sync runs cannot edit the store simultaneously. The next full reconciliation
recovers a failed or interrupted run.

All products and every managed code are read and checked before the first write.
Pagination is followed for the catalog, discount discovery, and product scopes.
Codes with conflicting identities, amounts, requirements, customer eligibility,
usage limits, variants, collections, or combination settings cause a failure.
Only the managed `CS-DESIGN15-` codes can be changed. The code format matches the
128 existing codes and the theme's deterministic code generator.

Repository code is public. Only schedules and owner-initiated manual runs can
start this workflow; it has no pull-request trigger. Credentials are passed only
to the sync step and only sent to the fixed Shopify shop. Its GitHub token is
read-only, action versions are pinned to verified commits, and no dependencies
are installed. Reports contain counts and discount codes, not tokens, customer
records, or order data. Standard hosted runners are free for this public repo.
Do not select a larger paid runner or enable paid usage for this task.

To pause scheduled synchronization, set `DESIGN_SYNC_ENABLED` to `false`.
Existing Shopify codes continue to work. Stop the task before manually changing
the conditions of its managed codes.

## Local checks

```sh
node --test automation/design-discounts/sync.test.mjs
node automation/design-discounts/sync.mjs --dry-run
```

The second command requires the two environment variables above. `--apply` is
explicit; without it the task only reads and plans. The report can be saved
locally by setting `DESIGN_SYNC_REPORT` to a file path.
