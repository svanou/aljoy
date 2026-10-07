import { site } from './site';
export const currency = 'EUR';
export const plans = { standard_monthly: { name: 'AI Team', amount: 2990, currency, maxActive: 1, priceEnv: 'STRIPE_STANDARD_PRICE_ID' }, double_monthly: { name: 'AI Team ×2', amount: 4990, currency, maxActive: 2, priceEnv: 'STRIPE_DOUBLE_PRICE_ID' } } as const;
export type Plan = keyof typeof plans;
export const benefits = ['Unlimited requests', 'One active request at a time', site.turnaround, 'AI & automation development', 'Unlimited revisions', 'Async communication', 'Pause or cancel anytime'];
export const money = (amount:number) => new Intl.NumberFormat('en-IE',{style:'currency',currency,maximumFractionDigits:0}).format(amount);
