'use client';
import { useLanguage } from '@/components/language-provider';
import { ArrowUpRight, Check } from 'lucide-react';
import { benefits, money, plans } from '@/config/pricing';
import { Button } from './ui/button';
import { useState } from 'react';
export function Pricing() { const { t, locale } = useLanguage(); const [error, setError] = useState(''); const [busy, setBusy] = useState(''); async function checkout(plan: string) { setBusy(plan); setError(''); try {
    const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const d = await r.json();
    if (d.url)
        window.location.href = d.url;
    else
        throw new Error(d.error || t("Checkout unavailable"));
}
catch (e) {
    setError((e as Error).message);
    setBusy('');
} } return <section className="section" id="pricing"><div className="pricing-layout"><div className="pricing-copy"><div className="eyebrow">{t("ONE SUBSCRIPTION. LESS FRICTION.")}</div><h2>{t("A whole team.")}<br />{t("One flat rate.")}</h2><p>{t("No hiring. No hourly billing.")}<br />{t("Just a dependable partner who gets it done.")}</p><span className="tag">{t("No long-term commitment")}</span></div><div className="pricing-card"><div className="pricing-main"><div className="plan-header"><h3>{t(plans.standard_monthly.name)}</h3><span className="tag">{t("Your unfair advantage")}</span></div><div className="price">{money(plans.standard_monthly.amount, locale)} <span>{t("/ month")}</span></div><p style={{ fontSize: 12, color: 'var(--muted)' }}>{t("Your dedicated AI & automation partner.")}</p><ul className="benefits">{benefits.map(x => <li key={x}><Check size={14} color="#638446"/>{t(x)}</li>)}</ul><Button className="full" disabled={!!busy} onClick={() => checkout('standard_monthly')}>{busy === 'standard_monthly' ? t("Opening checkout\u2026") : t("Start subscription")}<ArrowUpRight size={15}/></Button>{error && <p role="alert" className="notice error">{t(error)}</p>}<p style={{ textAlign: 'center', fontSize: 10, color: 'var(--muted)', marginTop: 13 }}>{t("Secure checkout \u00B7 Cancel anytime")}</p></div><div className="pricing-bottom"><div><strong>{t("Need more throughput?")}</strong><p>{t(plans.double_monthly.name)} · {money(plans.double_monthly.amount, locale)}{t("/mo")} · {t("2 active requests")}</p></div><button className="button ghost" disabled={!!busy} onClick={() => checkout('double_monthly')} aria-label={t("Subscribe to AI Team times two")}><ArrowUpRight size={18}/></button></div></div></div></section>; }
