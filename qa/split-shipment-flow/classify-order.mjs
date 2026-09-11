export default function main(input) {
  const order = input.order;
  const chinaTypes = new Set(['3d tshirt', '3d t-shirt', 'upf hoodie', 'combo']);
  const noticeTags = new Set(['split-shipment-notice-sent', 'split-shipment-notice-requested']);
  let chinaItemCount = 0;
  let otherItemCount = 0;
  let unclassifiedItemCount = 0;
  const productTypes = new Set();
  for (const item of order.lineItems) {
    const type = (item.product?.productType || '').trim().toLowerCase();
    if (!item.requiresShipping || item.isGiftCard || type === 'shipping insurance' || item.currentQuantity <= 0) continue;
    if (type) productTypes.add(type === '3d t-shirt' ? '3d tshirt' : type);
    if (!item.product || !type) unclassifiedItemCount += item.currentQuantity;
    else if (chinaTypes.has(type)) chinaItemCount += item.currentQuantity;
    else otherItemCount += item.currentQuantity;
  }
  const checkoutEmail = (order.email || '').trim();
  const mixedFactories = chinaItemCount > 0 && otherItemCount > 0;
  let decisionReason = 'ELIGIBLE_MIXED_FACTORIES';
  if (order.test) decisionReason = 'TEST_ORDER';
  else if (order.cancelledAt) decisionReason = 'CANCELLED_ORDER';
  else if (order.tags.some(tag => noticeTags.has(tag.trim().toLowerCase()))) decisionReason = 'ALREADY_NOTIFIED';
  else if (!checkoutEmail) decisionReason = 'MISSING_CHECKOUT_EMAIL';
  else if (unclassifiedItemCount > 0) decisionReason = 'UNCLASSIFIED_PHYSICAL_PRODUCT';
  else if (chinaItemCount + otherItemCount === 0) decisionReason = 'NO_PHYSICAL_ITEMS';
  else if (!chinaItemCount) decisionReason = 'OTHER_FACTORY_ONLY';
  else if (!otherItemCount) decisionReason = 'CHINA_FACTORY_ONLY';
  const customerEmail = order.customer?.defaultEmailAddress;
  let nativeRecipientReason = 'MATCHING_SUBSCRIBER';
  if (!order.customer?.id || !customerEmail?.emailAddress) nativeRecipientReason = 'NO_CUSTOMER_EMAIL';
  else if (customerEmail.emailAddress.trim().toLowerCase() !== checkoutEmail.toLowerCase()) nativeRecipientReason = 'CUSTOMER_EMAIL_DIFFERS_FROM_ORDER';
  else if (customerEmail.marketingState !== 'SUBSCRIBED') nativeRecipientReason = 'NOT_SUBSCRIBED';
  return {
    shouldNotify: decisionReason === 'ELIGIBLE_MIXED_FACTORIES',
    nativeRecipientEligible: nativeRecipientReason === 'MATCHING_SUBSCRIBER',
    nativeRecipientReason,
    mixedFactories,
    decisionReason,
    checkoutEmail,
    orderName: order.name,
    idempotencyKey: 'split-shipment-v1-' + order.id,
    chinaItemCount,
    otherItemCount,
    unclassifiedItemCount,
    productTypeCount: productTypes.size,
    productTypes: [...productTypes].sort(),
    factoryGroupCount: Number(chinaItemCount > 0) + Number(otherItemCount > 0),
    factoryGroups: [chinaItemCount > 0 ? 'CHINA' : '', otherItemCount > 0 ? 'OTHER' : ''].filter(Boolean)
  };
}
