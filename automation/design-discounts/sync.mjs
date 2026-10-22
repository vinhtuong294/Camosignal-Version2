import { appendFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const SHOP = 'apepsd-ha.myshopify.com';
export const APP_ID = 'gid://shopify/App/410080280577';
export const API_VERSION = '2026-10';
export const TITLE_PREFIX = 'Matching design 15% — ';
const PRODUCT_ID = /^gid:\/\/shopify\/Product\/[1-9]\d*$/;
const unique = values => [...new Set(values)].sort();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export function identity(value) {
  const tag = String(value).trim();
  const canonical = tag.toLowerCase();
  if (!canonical.startsWith('design:') || !canonical.slice(7).trim()) return null;
  const slug = canonical.slice(7).trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'design';
  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) hash = Math.imul(hash ^ canonical.charCodeAt(i), 16777619);
  return { tag, canonical, code: `CS-DESIGN15-${slug.toUpperCase()}-${(hash >>> 0).toString(16).padStart(8, '0').toUpperCase()}` };
}

export const queries = {
  access: `query DesignSyncAccess { shop { myshopifyDomain } currentAppInstallation { app { id title } accessScopes { handle } } }`,
  products: `query DesignSyncProducts($after: String) {
    products(first: 250, after: $after, sortKey: ID) {
      nodes { id tags } pageInfo { hasNextPage endCursor }
    }
  }`,
  discounts: `query DesignSyncDiscounts($after: String) {
    discountNodes(first: 100, after: $after, query: "method:code") {
      nodes { id discount { __typename ... on DiscountCodeBasic { title codes(first: 2) { nodes { code } } } } }
      pageInfo { hasNextPage endCursor }
    }
  }`,
  code: `query DesignSyncCode($code: String!, $after: String) {
    codeDiscountNodeByCode(code: $code) { id codeDiscount {
      __typename ... on DiscountCodeBasic {
        title endsAt usageLimit appliesOncePerCustomer context { __typename }
        combinesWith { productDiscounts orderDiscounts shippingDiscounts }
        codes(first: 2) { nodes { code } }
        minimumRequirement { ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity } }
        customerGets {
          value { ... on DiscountPercentage { percentage } }
          items { __typename ... on DiscountProducts {
            products(first: 250, after: $after) { nodes { id } pageInfo { hasNextPage endCursor } }
            productVariants(first: 1) { nodes { id } }
          } }
        }
      }
    } }
  }`,
};
export const mutations = {
  create: `mutation DesignSyncCreate($input: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $input) { codeDiscountNode { id } userErrors { code } }
  }`,
  update: `mutation DesignSyncUpdate($id: ID!, $input: DiscountCodeBasicInput!) {
    discountCodeBasicUpdate(id: $id, basicCodeDiscount: $input) { codeDiscountNode { id } userErrors { code } }
  }`,
  deactivate: `mutation DesignSyncDeactivate($id: ID!) {
    discountCodeDeactivate(id: $id) { codeDiscountNode { id } userErrors { code } }
  }`,
};

function fail(code) { throw new Error(code); }
function nextCursor(connection, previous) {
  if (!Array.isArray(connection?.nodes) || typeof connection?.pageInfo?.hasNextPage !== 'boolean') fail('INVALID_PAGE');
  if (!connection.pageInfo.hasNextPage) return null;
  const next = connection.pageInfo.endCursor;
  if (typeof next !== 'string' || !next || next === previous) fail('INVALID_CURSOR');
  return next;
}

/** Only the fixed shop receives credentials. Errors never include response bodies or tokens. */
export async function authenticate({clientId, clientSecret, fetcher = fetch}) {
  if (!clientId || !clientSecret) fail('MISSING_SHOPIFY_SECRETS');
  let response;
  try {
    response = await fetcher(`https://${SHOP}/admin/oauth/access_token`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20_000),
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret}),
    });
  } catch { fail('SHOPIFY_AUTH_NETWORK_ERROR'); }
  if (!response.ok) fail(`SHOPIFY_AUTH_HTTP_${response.status}`);
  const body = await response.json().catch(() => fail('SHOPIFY_AUTH_INVALID_JSON'));
  if (typeof body.access_token !== 'string' || !body.access_token) fail('SHOPIFY_AUTH_NO_TOKEN');
  return body.access_token;
}

export function createClient(token, {fetcher = fetch, sleep = pause, maxRequests = 5000} = {}) {
  let requests = 0;
  return async (query, variables = {}) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (++requests > maxRequests) fail('SHOPIFY_REQUEST_LIMIT');
      let response;
      try {
        response = await fetcher(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
          headers: {'content-type': 'application/json', 'X-Shopify-Access-Token': token},
          body: JSON.stringify({query, variables}),
        });
      } catch { fail('SHOPIFY_API_NETWORK_ERROR'); }
      // Retrying a transport failure on a create could duplicate a write. Retry only
      // explicit rate-limit responses, which Shopify has not executed.
      if (response.status === 429 && attempt < 4) { await sleep(1000 * 2 ** attempt); continue; }
      if (!response.ok) fail(`SHOPIFY_API_HTTP_${response.status}`);
      const body = await response.json().catch(() => fail('SHOPIFY_API_INVALID_JSON'));
      const errors = body.errors ?? [];
      if (errors.length && errors.every(e => e.extensions?.code === 'THROTTLED') && attempt < 4) {
        await sleep(1000 * 2 ** attempt); continue;
      }
      if (errors.length || !body.data) fail('SHOPIFY_GRAPHQL_ERROR');
      const throttle = body.extensions?.cost?.throttleStatus;
      if (throttle && throttle.currentlyAvailable < 100 && throttle.restoreRate > 0) {
        await sleep(Math.min(5000, Math.ceil((100 - throttle.currentlyAvailable) / throttle.restoreRate * 1000)));
      }
      return body.data;
    }
    fail('SHOPIFY_THROTTLED');
  };
}

export async function verifyAccess(graphql) {
  const data = await graphql(queries.access);
  if (data.shop?.myshopifyDomain !== SHOP || data.currentAppInstallation?.app?.id !== APP_ID) fail('WRONG_SHOPIFY_SHOP_OR_APP');
  const scopes = new Set(data.currentAppInstallation.accessScopes.map(scope => scope.handle));
  if (!scopes.has('read_products') && !scopes.has('write_products')) fail('MISSING_READ_PRODUCTS');
  if (!scopes.has('write_discounts')) fail('MISSING_WRITE_DISCOUNTS');
  return {shop: SHOP, app: data.currentAppInstallation.app.title};
}

export async function catalog(graphql) {
  const groups = new Map();
  let after = null, count = 0;
  do {
    const data = await graphql(queries.products, {after});
    const next = nextCursor(data.products, after);
    for (const product of data.products.nodes) {
      if (!PRODUCT_ID.test(product.id) || !Array.isArray(product.tags)) fail('INVALID_PRODUCT');
      count++;
      for (const tag of product.tags) {
        const design = identity(tag);
        if (!design) continue;
        const group = groups.get(design.canonical) ?? {...design, productIds: []};
        group.productIds.push(product.id);
        groups.set(design.canonical, group);
      }
    }
    after = next;
  } while (after);
  for (const group of groups.values()) group.productIds = unique(group.productIds);
  return {groups, count};
}

export async function discoverManagedCodes(graphql) {
  const groups = new Map();
  let after = null;
  do {
    const data = await graphql(queries.discounts, {after});
    const next = nextCursor(data.discountNodes, after);
    for (const node of data.discountNodes.nodes) {
      const discount = node.discount;
      if (discount?.__typename !== 'DiscountCodeBasic') continue;
      const codes = discount.codes?.nodes ?? [];
      if (!codes.some(entry => entry.code?.toUpperCase().startsWith('CS-DESIGN15-'))) continue;
      const design = discount.title?.startsWith(TITLE_PREFIX) ? identity(`design:${discount.title.slice(TITLE_PREFIX.length)}`) : null;
      if (!design || codes.length !== 1 || codes[0].code.toUpperCase() !== design.code || groups.has(design.canonical)) fail('MANAGED_CODE_IDENTITY_CONFLICT');
      groups.set(design.canonical, {...design, productIds: []});
    }
    after = next;
  } while (after);
  return groups;
}

export async function readScope(graphql, design) {
  const productIds = [];
  let after = null, result;
  do {
    const data = await graphql(queries.code, {code: design.code, after});
    const node = data.codeDiscountNodeByCode;
    if (!node) { if (after) fail('DISCOUNT_DISAPPEARED_DURING_READ'); return null; }
    const discount = node.codeDiscount;
    const items = discount.customerGets?.items;
    if (discount.__typename !== 'DiscountCodeBasic' || !discount.title?.startsWith(TITLE_PREFIX) ||
        identity(`design:${discount.title.slice(TITLE_PREFIX.length)}`)?.canonical !== design.canonical ||
        discount.codes?.nodes.length !== 1 || discount.codes.nodes[0].code.toUpperCase() !== design.code ||
        discount.customerGets?.value.percentage !== 0.15 ||
        String(discount.minimumRequirement?.greaterThanOrEqualToQuantity) !== '2' ||
        items?.__typename !== 'DiscountProducts' || !items.products || items.productVariants?.nodes.length ||
        discount.context?.__typename !== 'DiscountBuyerSelectionAll' || discount.usageLimit !== null || discount.appliesOncePerCustomer !== false ||
        discount.combinesWith?.productDiscounts !== true || discount.combinesWith?.orderDiscounts !== false || discount.combinesWith?.shippingDiscounts !== true) fail('MANAGED_CODE_CONFIGURATION_CONFLICT');
    const next = nextCursor(items.products, after);
    if (result && result.id !== node.id) fail('DISCOUNT_CHANGED_DURING_READ');
    result = {id: node.id, endsAt: discount.endsAt};
    for (const product of items.products.nodes) {
      if (!PRODUCT_ID.test(product.id)) fail('INVALID_DISCOUNT_PRODUCT');
      productIds.push(product.id);
    }
    after = next;
  } while (after);
  return {...result, productIds: unique(productIds)};
}

/** Read and validate the complete catalog and every managed code before any write. */
export async function planSync(graphql) {
  const current = await catalog(graphql);
  const known = await discoverManagedCodes(graphql);
  if (!current.count && known.size) fail('EMPTY_CATALOG_WITH_EXISTING_DISCOUNTS');
  const groups = new Map([...known, ...current.groups]);
  const plan = [];
  for (const design of groups.values()) {
    const existing = await readScope(graphql, design);
    const wanted = new Set(design.productIds);
    const have = new Set(existing?.productIds ?? []);
    const add = design.productIds.filter(id => !have.has(id));
    const remove = [...have].filter(id => !wanted.has(id));
    let action = 'unchanged';
    if (!existing && wanted.size) action = 'create';
    else if (existing && !wanted.size && !existing.endsAt) action = 'deactivate';
    else if (existing && wanted.size && (add.length || remove.length || existing.endsAt)) action = 'update';
    plan.push({design, existing, action, add, remove});
  }
  return {products: current.count, designs: groups.size, entries: plan};
}

function assertWrite(payload) {
  if (!payload?.codeDiscountNode?.id || !Array.isArray(payload.userErrors) || payload.userErrors.length) fail('SHOPIFY_DISCOUNT_WRITE_FAILED');
  return payload.codeDiscountNode.id;
}
export async function applyPlan(graphql, plan, {apply = false, now = new Date()} = {}) {
  const counts = {created: 0, updated: 0, deactivated: 0, unchanged: 0, writes: 0};
  for (const entry of plan.entries) {
    const {design, existing, action, add, remove} = entry;
    counts[`${action === 'create' ? 'created' : action === 'update' ? 'updated' : action === 'deactivate' ? 'deactivated' : 'unchanged'}`]++;
    if (!apply || action === 'unchanged') continue;
    if (action === 'deactivate') {
      assertWrite((await graphql(mutations.deactivate, {id: existing.id})).discountCodeDeactivate);
      counts.writes++;
      continue;
    }
    let id = existing?.id;
    let offset = 0;
    if (action === 'create') {
      const input = {
        title: `${TITLE_PREFIX}${design.tag.slice(7).trim()}`, code: design.code,
        startsAt: now.toISOString(), context: {all: 'ALL'},
        customerGets: {value: {percentage: 0.15}, items: {products: {productsToAdd: add.slice(0, 250)}}},
        minimumRequirement: {quantity: {greaterThanOrEqualToQuantity: '2'}},
        combinesWith: {productDiscounts: true, orderDiscounts: false, shippingDiscounts: true},
        appliesOncePerCustomer: false,
      };
      id = assertWrite((await graphql(mutations.create, {input})).discountCodeBasicCreate);
      counts.writes++;
      offset = 250;
    }
    for (; offset < Math.max(add.length, remove.length, action === 'update' ? 1 : 0); offset += 250) {
      const input = {endsAt: null, customerGets: {value: {percentage: 0.15}, items: {products: {
        productsToAdd: add.slice(offset, offset + 250), productsToRemove: remove.slice(offset, offset + 250),
      }}}};
      assertWrite((await graphql(mutations.update, {id, input})).discountCodeBasicUpdate);
      counts.writes++;
    }
    // Verify the server's final scope. A failed/partial run is repaired by the next
    // complete reconciliation; no separate database or cached membership is needed.
    const actual = await readScope(graphql, design);
    if (!actual || actual.endsAt || JSON.stringify(actual.productIds) !== JSON.stringify(design.productIds)) fail('DISCOUNT_READBACK_MISMATCH');
  }
  return counts;
}

export async function run({apply = false, clientId, clientSecret, graphql, output} = {}) {
  const started = Date.now();
  const client = graphql ?? createClient(await authenticate({clientId, clientSecret}));
  const access = await verifyAccess(client);
  const plan = await planSync(client);
  const counts = await applyPlan(client, plan, {apply});
  const summary = {...access, mode: apply ? 'apply' : 'dry-run', products: plan.products, designs: plan.designs, ...counts, seconds: Math.ceil((Date.now() - started) / 1000)};
  if (output) await writeFile(output, JSON.stringify({summary, changes: plan.entries.filter(e => e.action !== 'unchanged').map(e => ({code: e.design.code, action: e.action, add: e.add.length, remove: e.remove.length}))}, null, 2) + '\n');
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => !['--apply', '--dry-run'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) fail('INVALID_ARGUMENTS');
    const summary = await run({apply: args.includes('--apply'), clientId: process.env.DESIGN_SHOPIFY_CLIENT_ID?.trim(), clientSecret: process.env.DESIGN_SHOPIFY_CLIENT_SECRET?.trim(), output: process.env.DESIGN_SYNC_REPORT});
    console.log(JSON.stringify(summary));
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Design discount sync\n\nMode: ${summary.mode}\n\nProducts: ${summary.products}; designs: ${summary.designs}; created: ${summary.created}; updated: ${summary.updated}; deactivated: ${summary.deactivated}; unchanged: ${summary.unchanged}.\n\nCompleted in ${summary.seconds}s.\n`);
  } catch (error) {
    // Do not emit arbitrary error messages/stacks that could contain tokens or API data.
    const message = /^[A-Z][A-Z0-9_]+$/.test(error?.message ?? '') ? error.message : 'DESIGN_SYNC_FAILED';
    console.error(message);
    process.exitCode = 1;
  }
}
