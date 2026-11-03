// Execute only inside the current production API container. Secrets never leave its environment.
// This tool cannot create an order/subscription, capture a payment, refund, or modify an existing plan.
import { HttpPayPalApi } from './dist/modules/billing/providers/paypalApi.js';
import { createHash } from 'node:crypto';
const e = process.env;
if (e.PAYPAL_ENVIRONMENT !== 'live' || e.PAYPAL_SUBSCRIPTIONS_APPROVED !== 'true') throw new Error('Expected the approved live merchant environment');
const api = new HttpPayPalApi(e.PAYPAL_CLIENT_ID, e.PAYPAL_CLIENT_SECRET, 'live');
const old = await api.request('GET', '/v1/billing/plans/' + e.PAYPAL_PLUS_PLAN_ID);
const hook = await api.request('GET', '/v1/notifications/webhooks/' + e.PAYPAL_WEBHOOK_ID);
const product = await api.request('GET', '/v1/catalogs/products/' + e.PAYPAL_PLUS_PRODUCT_ID);
if (old.product_id !== product.id || product.id !== e.PAYPAL_PLUS_PRODUCT_ID || hook.url !== 'https://msg.meldiq.app/v1/billing/webhooks/paypal') throw new Error('Unexpected merchant product or webhook');
const required = ['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED', 'PAYMENT.SALE.COMPLETED', 'PAYMENT.SALE.REFUNDED'];
if (required.some(name => !hook.event_types.some(event => event.name === name || event.name === '*'))) throw new Error('Required webhook events are missing');
const legacy = { id: old.id, status: old.status, cycles: old.billing_cycles, productId: old.product_id };
const summary = { checkedAt: new Date().toISOString(), environment: 'live', productId: product.id, legacyPlan: legacy, expectedMonthlyAmountMinor: 499, webhook: { url: hook.url, requiredEventsConfigured: true, signedDeliveryVerified: false }, checkoutCreated: false, buyerApproved: false, publicCatalogChanged: false, runtimeConfigurationChanged: false };
if (!process.argv.includes('--prepare')) { console.log(JSON.stringify(summary)); process.exit(0); }
const body = { product_id: product.id, name: 'Meldiq Plus USD 4.99 monthly', description: 'Meldiq Plus, USD 4.99 each month, automatically renewing until cancelled.', status: 'ACTIVE', quantity_supported: false, billing_cycles: [{ frequency: { interval_unit: 'MONTH', interval_count: 1 }, tenure_type: 'REGULAR', sequence: 1, total_cycles: 0, pricing_scheme: { fixed_price: { value: '4.99', currency_code: 'USD' } } }], payment_preferences: { auto_bill_outstanding: true, setup_fee: { value: '0.00', currency_code: 'USD' }, setup_fee_failure_action: 'CANCEL', payment_failure_threshold: 2 }, taxes: { percentage: '0', inclusive: false } };
// Stable merchant/product/terms identity prevents duplicate resource creation on a bounded retry.
const requestId = createHash('sha256').update(product.id + ':meldiq-plus:USD:499:MONTH:1:v1').digest('hex').slice(0, 32);
const existingIndex = process.argv.indexOf('--existing-plan');
const existing = existingIndex < 0 ? null : process.argv[existingIndex + 1];
if (existing && !/^P-[A-Z0-9]+$/.test(existing)) throw new Error('Invalid prepared plan reference');
const result = existing ? { id: existing } : await api.request('POST', '/v1/billing/plans', body, requestId);
const plan = await api.request('GET', '/v1/billing/plans/' + result.id);
const cycle = plan.billing_cycles?.[0];
if (plan.id === old.id || plan.product_id !== product.id || plan.status !== 'ACTIVE' || plan.quantity_supported || plan.billing_cycles.length !== 1 || cycle.tenure_type !== 'REGULAR' || cycle.total_cycles !== 0 || cycle.frequency.interval_unit !== 'MONTH' || cycle.frequency.interval_count !== 1 || cycle.pricing_scheme.fixed_price.currency_code !== 'USD' || Number(cycle.pricing_scheme.fixed_price.value) !== 4.99 || Number(plan.payment_preferences?.setup_fee?.value ?? 0) !== 0 || Number(plan.taxes?.percentage ?? 0) !== 0) throw new Error('Prepared plan does not match approved monthly terms');
const unchanged = await api.request('GET', '/v1/billing/plans/' + old.id);
if (JSON.stringify(unchanged.billing_cycles) !== JSON.stringify(old.billing_cycles)) throw new Error('Legacy agreement pricing changed unexpectedly');
console.log(JSON.stringify({ ...summary, preparedPlan: { id: plan.id, status: plan.status, productId: plan.product_id, currency: 'USD', amountMinor: 499, interval: 'month', billingFrequency: 1 }, legacyPricingPreserved: true, publicSalesEnabled: false, note: 'Separate merchant plan only. Backend catalog publication and account-owned buyer approval remain required; no customer charge created.' }));
