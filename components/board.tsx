'use client';
import { useLanguage } from '@/components/language-provider';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { RequestForm } from './request-form';
import { Button } from './ui/button';
import { plans, type Plan } from '@/config/pricing';
import type { RequestItem, Status } from '@/lib/types';
import { createRequest, reorderQueue, uploadFile } from '@/app/dashboard/actions';
export function Board({ initial, firstName, workspaceId, demo = false, canCreate, plan }: {
    initial: RequestItem[];
    firstName: string;
    workspaceId: string;
    demo?: boolean;
    canCreate: boolean;
    plan: string;
}) {
    const { t, locale, requestText } = useLanguage();
    const [items, setItems] = useState(initial);
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const drag = useRef<string | null>(null);
    const router = useRouter();
    useEffect(() => { if (demo) {
        try {
            const saved = localStorage.getItem('aiflow-demo');
            if (saved)
                setItems(JSON.parse(saved));
        }
        catch { }
    }
    else
        setItems(initial); }, [initial, demo]);
    function persist(next: RequestItem[]) { setItems(next); if (demo)
        localStorage.setItem('aiflow-demo', JSON.stringify(next)); }
    async function move(id: string, target: string) { if (busy || id === target)
        return; const queued = items.filter(x => x.status === 'queued').sort((a, b) => a.position - b.position); const from = queued.findIndex(x => x.id === id), to = queued.findIndex(x => x.id === target); if (from < 0 || to < 0)
        return; queued.splice(to, 0, queued.splice(from, 1)[0]); const ids = queued.map(x => x.id); setBusy(true); try {
        if (!demo)
            await reorderQueue(workspaceId, ids);
        persist(items.map(x => x.status === 'queued' ? { ...x, position: ids.indexOf(x.id) } : x));
        if (!demo)
            router.refresh();
    }
    catch (e) {
        setMessage((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function add(form: FormData) { const file = form.get('file'); if (file instanceof File && file.size > 10485760)
        throw new Error(t("Maximum file size is 10 MB")); if (demo) {
        const next: RequestItem = { id: 'demo-' + crypto.randomUUID(), workspace_id: 'demo', title: String(form.get('title')), description: String(form.get('description')), category: String(form.get('category')), priority: String(form.get('priority')), status: 'queued', position: Math.max(0, ...items.map(x => x.position)) + 1, success: String(form.get('success')), links: String(form.get('links')), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), complexity: 'Small', tags: [] };
        persist([...items, next]);
        setMessage(t("Added to your demo queue. Files are not uploaded in demo mode."));
    }
    else {
        const id = await createRequest(form);
        if (file instanceof File && file.size) {
            try {
                await uploadFile(id, form);
            }
            catch (e) {
                setMessage('Request created. Attachment failed: ' + (e as Error).message);
            }
        }
        router.refresh();
    } }
    async function billing() { setBusy(true); try {
        const r = await fetch('/api/portal', { method: 'POST' });
        const d = await r.json();
        if (d.url)
            window.location.href = d.url;
        else
            throw new Error(d.error);
    }
    catch (e) {
        setMessage((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    const current = plans[plan as Plan] || plans.standard_monthly;
    return <><div className="workspace-title"><div><div className="eyebrow"><span className="dot"/>{t(" YOUR IDEAS, IN MOTION")}</div><h1>{t("Welcome, ")}{firstName}.</h1><p>{t("Your AI team is ready. What\u2019s next?")}</p></div><Button disabled={!canCreate} onClick={() => setShow(true)}><Plus size={15}/>{t(" New request")}</Button></div><div className="notice" style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap' }}><span><strong>{t(current.name)}</strong> · {current.maxActive} {t(current.maxActive > 1 ? 'active requests' : 'active request')} · {canCreate ? t("Subscription active") : t("No active subscription")}</span>{demo ? <Link href="/pricing">{t("Choose a plan \u2197")}</Link> : <button className="button ghost" style={{ padding: 0 }} disabled={busy} onClick={billing}>{t("Manage billing \u2197")}</button>}</div>{!canCreate && <p className="notice">{t("Your previous work remains available. ")}<Link href="/pricing"><u>{t("Start a subscription")}</u></Link>{t(" to add requests.")}</p>}<div className="board">{(['in_progress', 'queued', 'completed'] as Status[]).map(status => { const list = items.filter(x => x.status === status).sort((a, b) => a.position - b.position); return <section className="column" key={status}><div className="column-head"><div className="label">{status === 'in_progress' && <span className="dot"/>}{t(status.replace('_', ' ').toUpperCase())}</div><span className="tag">{list.length}</span></div>{list.map((r, i) => <article className="request-card" key={r.id} draggable={status === 'queued' && !busy} onDragStart={() => drag.current = r.id} onDragOver={e => { if (status === 'queued')
        e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (drag.current)
        void move(drag.current, r.id); drag.current = null; }}><div className="request-meta"><span className="tag">{t(r.category)}</span>{status === 'queued' ? <GripVertical size={13}/> : <span>{t(r.priority)}</span>}</div><Link href={`/dashboard/requests/${r.id}${demo ? '?demo=1' : ''}`}><h3>{requestText(r, 'title', demo)}</h3></Link><div className="request-meta"><span>{new Date(r.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short', day: 'numeric' })}</span>{status === 'queued' ? <div className="reorder"><button disabled={busy || i === 0} onClick={() => move(r.id, list[i - 1].id)} aria-label={t("Move {title} up", {title: requestText(r, 'title', demo)})}><ArrowUp size={12}/></button><button disabled={busy || i === list.length - 1} onClick={() => move(r.id, list[i + 1].id)} aria-label={t("Move {title} down", {title: requestText(r, 'title', demo)})}><ArrowDown size={12}/></button></div> : <span>{status === 'completed' ? t("\u2713 Delivered") : t("In development")}</span>}</div></article>)}{!list.length && <div className="empty">{status === 'queued' ? t("Your next idea goes here.") : status === 'completed' ? t("Your delivered work will appear here.") : t("Ready when you are.")}</div>}</section>; })}</div><p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 20 }}>{t("Drag queued requests to reorder, or use the arrows. Priority helps communicate urgency; queue order decides what starts next.")}</p>{show && <RequestForm onClose={() => setShow(false)} onSubmit={add}/>} {message && <div className="toast" role="status" onClick={() => setMessage('')}>{t(message)} <button aria-label={t("Dismiss notification")} className="button ghost" onClick={() => setMessage('')}>×</button></div>}</>;
}
