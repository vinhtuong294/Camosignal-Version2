# Split-shipment Flow — Shopify Messaging only

Store: Camo Signal / apepsd-ha.
Flow: Mixed-factory order - split shipment notice.
Flow ID: 01a07b29-ecee-793b-b494-57213ebc6e86.
Latest observation (Sep 8, 2026): Flow overview shows Turn on workflow (off). The linked Messaging email was updated and set back to active after editing. Actual delivery has not been verified.

The user explicitly requires Shopify Messaging only; do not install another email app or change Order confirmation. Messaging's Send marketing email action only reaches email marketing subscribers through order.customer.id. The earlier requirement to reach every checkout email cannot be fulfilled by this action. Activation is pending resolution of that audience mismatch.

## Saved workflow

1. Order created supplies the triggering order immediately, without requiring payment.
2. Run code reads order.email, product types, physical quantities, test/cancellation state, prior notice tags and the customer's default email/subscription state.
3. Condition requires BOTH runCode.shouldNotify=true AND runCode.nativeRecipientEligible=true.
4. True: Send marketing email (Messaging), with the saved Split shipment template and order.customer.id.
5. After the send action: Add order tags = split-shipment-notice-requested, on order.id.
6. False: Log output records the order name, product type/group counts, classification reason and Messaging recipient reason. The log does not include email addresses.

## Rules

CHINA includes normalized types 3d tshirt, 3d t-shirt, upf hoodie and combo. All other known physical product types are OTHER. Notification requires both groups. Counts represent these two configured groups, not verified individual factories.

Non-shipping items, gift cards, Shipping Insurance and currentQuantity<=0 are excluded. Unknown physical products/types, canceled orders, test orders, missing checkout emails and previously requested/notified orders are skipped.

Messaging recipient eligibility requires a customer ID, a default email matching the trimmed checkout email (case insensitive), and marketingState=SUBSCRIBED. This provider gate remains separate from business shouldNotify in Run code.

The duplicate guard recognizes split-shipment-notice-requested and split-shipment-notice-sent. The new tag records a send request, not confirmed inbox delivery. Tags alone do not guarantee exactly-once execution under concurrent retries. The code's idempotencyKey is not wired into Messaging, which does not expose that field here.

## Email configuration

Reusable template: 1790398, Split shipment - order update.
Current Messaging activity: 166156206271.
Current email editor: 76121158.
Send step: 01M1XPG9B90Y496V2G8Q07B3DJ.
Tag step: 01M1XPM0QSVJTKQYR0JKG13084.

Subject: Your Camo Signal order will ship in two separate packages
Preheader: Expect two deliveries. See which items arrive first and which need more production time.
From observed in Messaging: Camo Signal, admin@camosignal.com (unchanged).
Template uses native logo header, email-custom-liquid.html body on white #FFFFFF, and native green #2B3E32 footer with white text.

The linked email and reusable template explicitly confirm two separate packages, per the merchant's instruction. Customer-facing copy calls 3D T-shirts "Jersey" and identifies Jersey, UPF hoodies, combo sets and individual products from those combo sets (including separate purchases) as expected later (12–16 days). Other ordered items are expected first (6–10 days). A line below Expected later refers to the shipping policy on each product's detail page. Copy describes additional production time without naming factory locations, and states delivery windows are estimates. These copy changes do not rename Shopify product types or add types to the classifier; standalone combo component types still need identification if they differ from the configured types.

## Validation

38 local classification/recipient checks passed. Native Shopify Run code preview on #4334 returned OTHER_FACTORY_ONLY, one physical type and one OTHER group; insurance was excluded. Its subscribed profile email matched checkout, so nativeRecipientEligible=true, but shouldNotify=false. Native final AND condition correctly evaluated false. No send or order-tag mutation was executed during the dry run.

The editor shows the configured template, both AND criteria and the Send marketing email -> Add order tags connection. It remains Draft. Actual email delivery has not been tested. A future delivery test must use a confirmed user-controlled recipient; do not replay historical customer orders.

## Reference artifacts not used

transactional-email.html and order-confirmation-notice.liquid are unused alternatives from earlier exploration. The user chose Messaging only. Do not deploy either as an alternate sender or modify Order confirmation. The notification snippet was not production-validated; its bundled validator could not start because @shopify/theme-check-common is missing.
