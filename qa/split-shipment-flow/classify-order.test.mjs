import assert from 'node:assert/strict';
import classify from './classify-order.mjs';

const item = (productType, overrides = {}) => ({ currentQuantity: 1, requiresShipping: true, isGiftCard: false, product: { productType }, ...overrides });
const order = (lineItems, overrides = {}) => ({ id: 'gid://shopify/Order/123', name: '#TEST', email: 'checkout@example.com', test: false, cancelledAt: null, tags: [], lineItems, ...overrides });
const mixed = [item('Combo'), item('Hoodie')];
const cases = [
  ['China only', order([item('3D Tshirt'), item('UPF HOODIE'), item('Combo')]), false, 'CHINA_FACTORY_ONLY'],
  ['Other only', order([item('T-shirt'), item('Hoodie')]), false, 'OTHER_FACTORY_ONLY'],
  ['3D mixed', order([item('3D Tshirt'), item('T-shirt')]), true, 'ELIGIBLE_MIXED_FACTORIES'],
  ['UPF mixed case', order([item('UPF Hoodie'), item('Long-sleeve')]), true, 'ELIGIBLE_MIXED_FACTORIES'],
  ['Combo mixed', order(mixed), true, 'ELIGIBLE_MIXED_FACTORIES'],
  ['Insurance excluded even if shippable', order([item('Combo'), item('Shipping Insurance')]), false, 'CHINA_FACTORY_ONLY'],
  ['Non-shipping excluded', order([item('Combo'), item('Digital', { requiresShipping: false })]), false, 'CHINA_FACTORY_ONLY'],
  ['Gift card excluded', order([item('Combo'), item('Gift card', { isGiftCard: true })]), false, 'CHINA_FACTORY_ONLY'],
  ['Refunded/removed item excluded', order([item('Combo'), item('Hoodie', { quantity: 2, currentQuantity: 0 })]), false, 'CHINA_FACTORY_ONLY'],
  ['Empty order', order([]), false, 'NO_PHYSICAL_ITEMS'],
  ['No checkout email', order(mixed, { email: null }), false, 'MISSING_CHECKOUT_EMAIL'],
  ['Test order', order(mixed, { test: true }), false, 'TEST_ORDER'],
  ['Cancelled order', order(mixed, { cancelledAt: '2026-09-07T00:00:00Z' }), false, 'CANCELLED_ORDER'],
  ['Already notified', order(mixed, { tags: ['split-shipment-notice-sent'] }), false, 'ALREADY_NOTIFIED'],
  ['Unrelated tag', order(mixed, { tags: ['VIP'] }), true, 'ELIGIBLE_MIXED_FACTORIES'],
  ['Missing product reference', order([item('Combo'), item('', { product: null })]), false, 'UNCLASSIFIED_PHYSICAL_PRODUCT'],
  ['Empty type', order([item('Combo'), item('  ')]), false, 'UNCLASSIFIED_PHYSICAL_PRODUCT'],
  ['Normalized China type', order([item(' 3D T-Shirt '), item('T-shirt')]), true, 'ELIGIBLE_MIXED_FACTORIES'],
  ['Non-subscriber is eligible', order(mixed, { customerAcceptsMarketing: false }), true, 'ELIGIBLE_MIXED_FACTORIES'],
  ['Whitespace-only email', order(mixed, { email: '   ' }), false, 'MISSING_CHECKOUT_EMAIL'],
];
for (const [label, inputOrder, expected, reason] of cases) {
  const result = classify({ order: inputOrder });
  assert.equal(result.shouldNotify, expected, label);
  assert.equal(result.decisionReason, reason, label);
}
assert.equal(classify({ order: order(mixed, { customer: { email: 'different@example.com' } }) }).checkoutEmail, 'checkout@example.com');
const counts = classify({ order: order([item('Combo', { currentQuantity: 3 }), item('Hoodie', { currentQuantity: 2 })]) });
assert.deepEqual([counts.chinaItemCount, counts.otherItemCount], [3, 2]);
assert.equal(counts.idempotencyKey, classify({ order: order(mixed) }).idempotencyKey);
assert.deepEqual([counts.productTypeCount, counts.factoryGroupCount, counts.factoryGroups], [2, 2, ['CHINA', 'OTHER']]);
const sameGroup = classify({ order: order([item('3D Tshirt'), item('UPF HOODIE'), item('Combo')]) });
assert.deepEqual([sameGroup.productTypeCount, sameGroup.factoryGroupCount, sameGroup.shouldNotify], [3, 1, false]);
const normalized = classify({ order: order([item('UPF HOODIE'), item('UPF Hoodie'), item('3D T-shirt'), item('3D Tshirt')]) });
assert.deepEqual([normalized.productTypeCount, normalized.factoryGroupCount], [2, 1]);
const recipient = (emailAddress = 'checkout@example.com', marketingState = 'SUBSCRIBED') => ({ id: 'gid://shopify/Customer/456', defaultEmailAddress: { emailAddress, marketingState } });
const nativeCases = [
  ['Matching subscriber', recipient(), true, 'MATCHING_SUBSCRIBER'],
  ['Normalized matching address', recipient(' Checkout@Example.com '), true, 'MATCHING_SUBSCRIBER'],
  ['Different email', recipient('other@example.com'), false, 'CUSTOMER_EMAIL_DIFFERS_FROM_ORDER'],
  ['Plus alias remains distinct', recipient('checkout+other@example.com'), false, 'CUSTOMER_EMAIL_DIFFERS_FROM_ORDER'],
  ['Unsubscribed', recipient(undefined, 'UNSUBSCRIBED'), false, 'NOT_SUBSCRIBED'],
  ['Not subscribed', recipient(undefined, 'NOT_SUBSCRIBED'), false, 'NOT_SUBSCRIBED'],
  ['Pending consent', recipient(undefined, 'PENDING'), false, 'NOT_SUBSCRIBED'],
  ['No customer', null, false, 'NO_CUSTOMER_EMAIL'],
  ['No email address', { id: '123', defaultEmailAddress: null }, false, 'NO_CUSTOMER_EMAIL'],
  ['No customer id', { defaultEmailAddress: recipient().defaultEmailAddress }, false, 'NO_CUSTOMER_EMAIL'],
];
for (const [label, customer, eligible, reason] of nativeCases) {
  const result = classify({ order: order(mixed, { customer }) });
  assert.equal(result.shouldNotify, true, `${label}: business eligibility is independent of provider`);
  assert.equal(result.nativeRecipientEligible, eligible, label);
  assert.equal(result.nativeRecipientReason, reason, label);
}
assert.equal(classify({ order: order(mixed, { tags: [' split-shipment-notice-requested '] }) }).shouldNotify, false);
assert.equal(classify({ order: order([item('Combo')], { customer: recipient() }) }).shouldNotify, false);
console.log('38 classification and recipient checks passed; no emails sent.');
