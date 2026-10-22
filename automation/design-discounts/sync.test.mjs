import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {identity, SHOP, APP_ID, TITLE_PREFIX, queries, mutations, authenticate, createClient, verifyAccess, catalog, discoverManagedCodes, readScope, planSync, applyPlan, run} from './sync.mjs';

const pid = n => `gid://shopify/Product/${n}`;
const page = (nodes, cursor = null) => ({nodes, pageInfo:{hasNextPage:!!cursor, endCursor:cursor}});
const farmer = {...identity('design:farmer'),productIds:[pid(1),pid(2)]};
function existing(design = farmer, ids = design.productIds, changes = {}, cursor = null) {
  return {id:'gid://shopify/DiscountCodeNode/1',codeDiscount:{
    __typename:'DiscountCodeBasic',title:TITLE_PREFIX+design.tag.slice(7),endsAt:null,
    usageLimit:null,appliesOncePerCustomer:false,context:{__typename:'DiscountBuyerSelectionAll'},
    combinesWith:{productDiscounts:true,orderDiscounts:false,shippingDiscounts:true},
    codes:{nodes:[{code:design.code}]},minimumRequirement:{greaterThanOrEqualToQuantity:'2'},
    customerGets:{value:{percentage:0.15},items:{__typename:'DiscountProducts',products:page(ids.map(id=>({id})),cursor),productVariants:{nodes:[]}}},
    ...changes,
  }};
}
const ok = {codeDiscountNode:{id:'gid://shopify/DiscountCodeNode/1'},userErrors:[]};
const access = {shop:{myshopifyDomain:SHOP},currentAppInstallation:{app:{id:APP_ID,title:'Camo Signal Listing'},accessScopes:[{handle:'read_products'},{handle:'write_discounts'}]}};

test('identity preserves the deployed code algorithm and ignores invalid tags',()=>{
  assert.equal(identity('design:Rack-Seeker-Camo').code,'CS-DESIGN15-RACK-SEEKER-CAMO-296F4A1B');
  assert.equal(identity(' DESIGN:FARMER ').code,farmer.code);
  assert.equal(identity('desgin:farmer'),null);
  assert.equal(identity('design:  '),null);
  assert.notEqual(identity('design:farmer-two').code,farmer.code);
});
test('auth sends credentials only to the fixed Shopify endpoint and returns no persisted token',async()=>{
  let request;
  assert.equal(await authenticate({clientId:'id',clientSecret:'secret',fetcher:async(url,options)=>{
    request={url,options};return Response.json({access_token:'token'});
  }}),'token');
  assert.equal(request.url,`https://${SHOP}/admin/oauth/access_token`);
  assert.equal(request.options.redirect,'error');
  assert.equal(request.options.body.get('grant_type'),'client_credentials');
});
test('auth errors never expose upstream credentials or error details',async()=>{
  await assert.rejects(authenticate({clientId:'id',clientSecret:'secret',fetcher:async()=>new Response('secret',{status:400})}),/^Error: SHOPIFY_AUTH_HTTP_400$/);
  await assert.rejects(authenticate({clientId:'id',clientSecret:'secret',fetcher:async()=>{throw new Error('secret')}}),/^Error: SHOPIFY_AUTH_NETWORK_ERROR$/);
});
test('API retries explicit throttles, uses fixed host, and enforces a request budget',async()=>{
  let calls=0;const sleeps=[];
  const client=createClient('token',{maxRequests:3,sleep:async ms=>sleeps.push(ms),fetcher:async(url,options)=>{
    assert.equal(url,`https://${SHOP}/admin/api/2026-10/graphql.json`);
    assert.equal(options.redirect,'error');
    calls++;return calls===1?Response.json({errors:[{extensions:{code:'THROTTLED'}}]}):Response.json({data:{ok:true}});
  }});
  assert.deepEqual(await client('query X { shop { id } }'),{ok:true});
  assert.equal(sleeps.length,1);
  await client('query X { shop { id } }');
  await assert.rejects(client('query X { shop { id } }'),/REQUEST_LIMIT/);
});
test('a transport failure is never blindly retried for a mutation',async()=>{
  let calls=0;const client=createClient('token',{fetcher:async()=>{calls++;throw new Error('secret')}});
  await assert.rejects(client(mutations.create),/NETWORK_ERROR/);assert.equal(calls,1);
});
test('wrong shop, wrong app, and missing discount access stop before writes',async()=>{
  await assert.rejects(verifyAccess(async()=>({...access,shop:{myshopifyDomain:'other.myshopify.com'}})),/WRONG_SHOPIFY/);
  await assert.rejects(verifyAccess(async()=>({...access,currentAppInstallation:{...access.currentAppInstallation,app:{id:'wrong'}}})),/WRONG_SHOPIFY/);
  await assert.rejects(verifyAccess(async()=>({...access,currentAppInstallation:{...access.currentAppInstallation,accessScopes:[{handle:'read_products'}]}})),/MISSING_WRITE_DISCOUNTS/);
  assert.equal((await verifyAccess(async()=>access)).shop,SHOP);
});
test('catalog follows all pages and groups multiple design tags without substring matches',async()=>{
  const result=await catalog(async(q,{after})=>({products:after?page([{id:pid(2),tags:['design:farmer']},{id:pid(3),tags:['design:farmer-extra']}])
    :page([{id:pid(1),tags:['design:farmer','design:second','DESIGN:FARMER']},{id:pid(4),tags:['desgin:farmer']}],'next')}));
  assert.equal(result.count,4);
  assert.deepEqual(result.groups.get(farmer.canonical).productIds,[pid(1),pid(2)]);
  assert.equal(result.groups.size,3);
});
test('a repeated pagination cursor stops reconciliation',async()=>{
  await assert.rejects(catalog(async()=>({products:page([],'repeat')})),/INVALID_CURSOR/);
});
test('discovery paginates, ignores unrelated promotions, and finds empty old designs',async()=>{
  let calls=0;
  const result=await discoverManagedCodes(async(q,{after})=>{calls++;return {discountNodes:after?page([{id:'1',discount:existing().codeDiscount}]):page([{discount:{__typename:'DiscountCodeBasic',title:'SUMMER',codes:{nodes:[{code:'SUMMER'}]}}}],'next')};});
  assert.equal(calls,2);assert.equal(result.get(farmer.canonical).code,farmer.code);assert.deepEqual(result.get(farmer.canonical).productIds,[]);
});
test('a managed prefix with a different identity is not adopted',async()=>{
  const bad=existing().codeDiscount;bad.title='Other promotion';
  await assert.rejects(discoverManagedCodes(async()=>({discountNodes:page([{discount:bad}])})),/IDENTITY_CONFLICT/);
});
test('scope pagination reads all products before any diff',async()=>{
  const result=await readScope(async(q,{after})=>({codeDiscountNodeByCode:existing(farmer,after?[pid(2)]:[pid(1)],{},after?null:'next')}),farmer);
  assert.deepEqual(result.productIds,[pid(1),pid(2)]);
});
for(const [label,change] of [
  ['wrong amount',{customerGets:{value:{percentage:0.2},items:existing().codeDiscount.customerGets.items}}],
  ['minimum 1',{minimumRequirement:{greaterThanOrEqualToQuantity:'1'}}],
  ['customer restriction',{context:{__typename:'DiscountCustomers'}}],
  ['usage limit',{usageLimit:1}],
  ['wrong combinations',{combinesWith:{productDiscounts:false,orderDiscounts:false,shippingDiscounts:true}}],
  ['collection scope',{customerGets:{value:{percentage:0.15},items:{__typename:'DiscountCollections'}}}],
  ['variant scope',{customerGets:{value:{percentage:0.15},items:{...existing().codeDiscount.customerGets.items,productVariants:{nodes:[{id:'variant'}]}}}}],
]) test(`scope rejects ${label}`,async()=>{
  await assert.rejects(readScope(async()=>({codeDiscountNodeByCode:existing(farmer,farmer.productIds,change)}),farmer),/CONFIGURATION_CONFLICT/);
});
test('planning finishes all reads before applying changes and dry-run performs no mutations',async()=>{
  const calls=[];
  const client=async(q)=>{
    calls.push(q);
    if(q===queries.products)return {products:page([{id:pid(1),tags:['design:farmer']},{id:pid(2),tags:['design:farmer']}])};
    if(q===queries.discounts)return {discountNodes:page([{discount:existing().codeDiscount}])};
    if(q===queries.code)return {codeDiscountNodeByCode:existing(farmer,[pid(1),pid(3)])};
    throw new Error('Unexpected mutation');
  };
  const plan=await planSync(client);
  assert.deepEqual(plan.entries[0].add,[pid(2)]);assert.deepEqual(plan.entries[0].remove,[pid(3)]);
  const counts=await applyPlan(client,plan);
  assert.equal(counts.writes,0);assert.equal(counts.updated,1);assert.equal(calls.length,3);
});
test('unchanged scopes do not generate writes',async()=>{
  const plan={entries:[{design:farmer,existing:existing(),action:'unchanged',add:[],remove:[]}]};
  const counts=await applyPlan(async()=>{throw new Error('Unexpected request')},plan,{apply:true});
  assert.equal(counts.unchanged,1);assert.equal(counts.writes,0);
});
test('new design creates exactly 15%, all buyers, quantity two, then verifies scope',async()=>{
  const calls=[];
  const counts=await applyPlan(async(q,v)=>{calls.push({q,v});return q===mutations.create?{discountCodeBasicCreate:ok}:{codeDiscountNodeByCode:existing()};},
    {entries:[{design:farmer,existing:null,action:'create',add:farmer.productIds,remove:[]}]},{apply:true,now:new Date('2026-10-22T00:00:00Z')});
  assert.equal(counts.created,1);assert.equal(counts.writes,1);
  const input=calls[0].v.input;
  assert.deepEqual(input.context,{all:'ALL'});
  assert.equal(input.customerGets.value.percentage,0.15);
  assert.deepEqual(input.minimumRequirement,{quantity:{greaterThanOrEqualToQuantity:'2'}});
  assert.deepEqual(input.customerGets.items.products.productsToAdd,farmer.productIds);
});
test('a large design batches IDs at 250 and verifies the full scope',async()=>{
  const ids=Array.from({length:501},(_,i)=>pid(i+1)).sort();
  const design={...farmer,productIds:ids};const batches=[];
  const counts=await applyPlan(async(q,v)=>{
    if(q===mutations.create){batches.push(v.input.customerGets.items.products.productsToAdd.length);return {discountCodeBasicCreate:ok};}
    if(q===mutations.update){batches.push(v.input.customerGets.items.products.productsToAdd.length);return {discountCodeBasicUpdate:ok};}
    return {codeDiscountNodeByCode:existing(design,ids)};
  },{entries:[{design,existing:null,action:'create',add:ids,remove:[]}]},{apply:true});
  assert.deepEqual(batches,[250,250,1]);assert.equal(counts.writes,3);
});
test('tag changes remove old product membership and reactivate returning designs',async()=>{
  const desired={...farmer,productIds:[pid(2),pid(3)]};const calls=[];
  await applyPlan(async(q,v)=>{calls.push({q,v});return q===mutations.update?{discountCodeBasicUpdate:ok}:{codeDiscountNodeByCode:existing(desired,desired.productIds)};},
    {entries:[{design:desired,existing:{id:'1',endsAt:'past'},action:'update',add:[pid(3)],remove:[pid(1)]}]},{apply:true});
  assert.deepEqual(calls[0].v.input.customerGets.items.products,{productsToAdd:[pid(3)],productsToRemove:[pid(1)]});
  assert.equal(calls[0].v.input.endsAt,null);
});
test('empty old designs are disabled without deleting their codes',async()=>{
  const calls=[];
  await applyPlan(async(q,v)=>{calls.push(q);return {discountCodeDeactivate:ok};},
    {entries:[{design:{...farmer,productIds:[]},existing:{id:'1'},action:'deactivate',add:[],remove:farmer.productIds}]},{apply:true});
  assert.deepEqual(calls,[mutations.deactivate]);
});
test('an unexpectedly empty catalog is not used to deactivate all codes',async()=>{
  await assert.rejects(planSync(async(q)=>q===queries.products?{products:page([])}:{discountNodes:page([{discount:existing().codeDiscount}])}),/EMPTY_CATALOG/);
});
test('failed writes and wrong readbacks stop with a generic error',async()=>{
  const plan={entries:[{design:farmer,existing:null,action:'create',add:farmer.productIds,remove:[]}]};
  await assert.rejects(applyPlan(async()=>({discountCodeBasicCreate:{...ok,userErrors:[{code:'TAKEN'}]}}),plan,{apply:true}),/WRITE_FAILED/);
  await assert.rejects(applyPlan(async(q)=>q===mutations.create?{discountCodeBasicCreate:ok}:{codeDiscountNodeByCode:existing(farmer,[pid(1)])},plan,{apply:true}),/READBACK_MISMATCH/);
});
test('a run verifies access before reading the catalog',async()=>{
  const calls=[];
  await assert.rejects(run({graphql:async(q)=>{calls.push(q);return {...access,shop:{myshopifyDomain:'wrong'}};}}),/WRONG_SHOPIFY/);
  assert.deepEqual(calls,[queries.access]);
});
test('workflow is gated, serial, read-only on GitHub, and never accepts pull requests',async()=>{
  const workflow=await readFile(new URL('../../.github/workflows/design-discounts.yml',import.meta.url),'utf8');
  assert.match(workflow,/DESIGN_SYNC_ENABLED == 'true'/);
  assert.match(workflow,/contents: read/);assert.match(workflow,/cancel-in-progress: false/);
  assert.doesNotMatch(workflow,/pull_request/);assert.doesNotMatch(workflow,/npm install|npm ci/);
});
