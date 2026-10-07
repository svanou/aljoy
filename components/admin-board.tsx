'use client';
import { useLanguage } from '@/components/language-provider';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { plans, money, type Plan } from '@/config/pricing';
import { entitled, advanceQueue } from '@/lib/queue';
import type { RequestItem, Status } from '@/lib/types';
import { changeStatus, autoAdvance, startNext, reorderQueue } from '@/app/dashboard/actions';
import { Button } from './ui/button';
type Subscription = {
    plan: string;
    status: string;
    current_period_end: string | null;
};
type Client = {
    id: string;
    name: string;
    auto_advance: boolean;
    subscriptions: Subscription | Subscription[] | null;
};
export function AdminBoard({ requests, clients, demo = false }: {
    requests: RequestItem[];
    clients: Client[];
    demo?: boolean;
}) { const { t, locale, requestText } = useLanguage(); const [items, setItems] = useState(requests); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [filter, setFilter] = useState('all'); const [automatic, setAutomatic] = useState(true); const router = useRouter(); useEffect(() => { if (demo) {
    try {
        const saved = localStorage.getItem('aiflow-demo');
        if (saved)
            setItems(JSON.parse(saved));
    }
    catch { }
}
else
    setItems(requests); }, [demo, requests]); const subs = clients.map(c => ({ client: c, sub: Array.isArray(c.subscriptions) ? c.subscriptions[0] : c.subscriptions })); const active = subs.filter(x => x.sub && entitled(x.sub.status, x.sub.current_period_end)); const mrr = active.reduce((sum, x) => sum + (plans[x.sub!.plan as Plan]?.amount || 0), 0); const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0); async function run(fn: () => Promise<void>) { setBusy(true); setMessage(''); try {
    await fn();
    router.refresh();
}
catch (e) {
    setMessage((e as Error).message);
}
finally {
    setBusy(false);
} } async function status(id: string, s: Status) { if (demo) {
    const next = items.map(x => x.id === id ? { ...x, status: s, updated_at: new Date().toISOString() } : x);
    if (s === 'in_progress' && next.filter(x => x.status === 'in_progress').length > 1)
        throw new Error(t("One active request at a time. Complete or queue the current request first."));
    const updated = s === 'completed' ? advanceQueue(next, 1, automatic) : next;
    setItems(updated);
    localStorage.setItem('aiflow-demo', JSON.stringify(updated));
}
else
    await changeStatus(id, s); } const list = items.filter(x => filter === 'all' ? x.status === 'in_progress' : x.workspace_id === filter); return <><div className="workspace-title"><div><div className="eyebrow">{t("THE OPERATOR\u2019S VIEW")}</div><h1>{t("Work queue.")}</h1><p>{t("A focused view of the work that matters now.")}</p></div></div><div className="stats">{[[t("Active clients"), active.length], [t("MRR"), money(mrr, locale)], [t("Active requests"), items.filter(x => x.status === 'in_progress').length], [t("Queued requests"), items.filter(x => x.status === 'queued').length], [t("Completed this month"), items.filter(x => x.status === 'completed' && new Date(x.updated_at) >= month).length]].map(([k, v]) => <div className="stat" key={k}><p>{t(String(k))}</p><strong>{v}</strong></div>)}</div>{message && <p className="notice error" role="alert">{t(message)}</p>}<label className="field" style={{ maxWidth: 300 }}>{t("View")}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{t("All active requests")}</option>{clients.map(c => <option key={c.id} value={c.id}>{demo ? t(c.name) : c.name}</option>)}</select></label><div className="table-wrap"><table><thead><tr><th>{t("Request")}</th><th>{t("Client")}</th><th>{t("Priority")}</th><th>{t("Status")}</th><th>{t("Action")}</th></tr></thead><tbody>{list.map(r => <tr key={r.id}><td><Link href={`/dashboard/requests/${r.id}${demo ? '?demo=1' : ''}`}>{requestText(r, 'title', demo)} ↗</Link><p style={{ fontSize: 10, color: 'var(--muted)' }}>{t(r.category)} · {t("Updated")} {new Date(r.updated_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</p></td><td>{demo ? t(clients.find(c => c.id === r.workspace_id)?.name || "") : clients.find(c => c.id === r.workspace_id)?.name}</td><td>{t(r.priority)}</td><td><span className="tag">{t(r.status.replace('_', ' '))}</span></td><td><select aria-label={t("Change status of {title}", {title: requestText(r, 'title', demo)})} value={r.status} disabled={busy} onChange={e => run(() => status(r.id, e.target.value as Status))}>{['queued', 'in_progress', 'completed'].map(s => <option key={s} value={s}>{t(s.replace('_', ' '))}</option>)}</select></td></tr>)}</tbody></table>{!list.length && <div className="empty">{t("No active work in this view.")}</div>}</div><h3 style={{ marginTop: 45, marginBottom: 20 }}>{t("Clients & subscriptions")}</h3>{subs.map(({ client: c, sub }) => <section className="detail-box" key={c.id}><div className="workspace-title" style={{ margin: 0 }}><div><h3>{demo ? t(c.name) : c.name}</h3><p>{t(plans[sub?.plan as Plan]?.name || 'No plan')} · {t(sub?.status || 'inactive')}</p></div><Button variant="outline" className="small" disabled={busy} onClick={() => run(async () => { if (demo) {
    const next = advanceQueue(items, 1);
    setItems(next);
    localStorage.setItem('aiflow-demo', JSON.stringify(next));
}
else
    await startNext(c.id); })}>{t("Start next queued")}</Button></div><label className="field" style={{ display: 'flex', alignItems: 'center' }}><input style={{ width: 'auto' }} type="checkbox" defaultChecked={c.auto_advance} onChange={e => { const value = e.target.checked; if (demo)
    setAutomatic(value);
else
    void run(() => autoAdvance(c.id, value)); }}/>{t("Automatically start the next request after completion")}</label><div>{items.filter(x => x.workspace_id === c.id && x.status === 'queued').sort((a, b) => a.position - b.position).map((q, i, list) => <div key={q.id} className="comment" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><Link href={`/dashboard/requests/${q.id}${demo ? '?demo=1' : ''}`} style={{ fontSize: 12 }}>{i + 1}. {requestText(q, 'title', demo)}</Link><Button variant="ghost" className="small" disabled={busy || i === 0} onClick={() => run(async () => { const ids = list.map(x => x.id); [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]; if (demo) {
    const next = items.map(x => x.workspace_id === c.id && x.status === 'queued' ? { ...x, position: ids.indexOf(x.id) } : x);
    setItems(next);
    localStorage.setItem('aiflow-demo', JSON.stringify(next));
}
else
    await reorderQueue(c.id, ids); })} aria-label={t("Move {title} up", {title: requestText(q, 'title', demo)})}>{t("\u2191 Move up")}</Button></div>)}</div></section>)}</>; }
