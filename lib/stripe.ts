import Stripe from 'stripe';
export function stripe(){if(!process.env.STRIPE_SECRET_KEY)throw new Error('Billing is not configured yet. Please contact us to subscribe.');return new Stripe(process.env.STRIPE_SECRET_KEY)}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');const expected=new URL(process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000').origin;return origin===expected}
