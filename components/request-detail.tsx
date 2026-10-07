'use client';
import { useLanguage } from '@/components/language-provider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RequestItem, Comment, Status } from '@/lib/types';
import { demoRequests } from '@/lib/demo';
import { Button } from './ui/button';
import { RequestForm } from './request-form';
import { addComment, editRequest, deleteRequest, uploadFile, fileLink, revision, approve, changeStatus, addDeliverable, adminMetadata } from '@/app/dashboard/actions';
type Asset = {
    id: string;
    name?: string;
    title?: string;
    path?: string;
    url?: string;
    approved_at?: string;
};
type Event = {
    id: string;
    body: string;
    created_at: string;
};
export function RequestDetail({ id, initial, demo = false, admin, comments: initialComments, files, deliverables, events }: {
    id: string;
    initial: RequestItem | null;
    demo?: boolean;
    admin: boolean;
    comments: Comment[];
    files: Asset[];
    deliverables: Asset[];
    events: Event[];
}) {
    const { t, locale, requestText } = useLanguage();
    const router = useRouter();
    const [item, setItem] = useState(initial);
    const [comments, setComments] = useState(initialComments);
    const [message, setMessage] = useState('');
    const [edit, setEdit] = useState(false);
    const [busy, setBusy] = useState(false);
    const [rev, setRev] = useState(false);
    useEffect(() => { if (demo) {
        try {
            const data = JSON.parse(localStorage.getItem('aiflow-demo') || JSON.stringify(demoRequests)) as RequestItem[];
            setItem(data.find(x => x.id === id) || null);
            setComments(JSON.parse(localStorage.getItem('aiflow-comments-' + id) || '[]'));
        }
        catch { }
    }
    else {
        setItem(initial);
        setComments(initialComments);
    } }, [id, demo, initial, initialComments]);
    async function run(action: () => Promise<void>) { setBusy(true); setMessage(''); try {
        await action();
        router.refresh();
    }
    catch (e) {
        setMessage((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    function saveDemo(next: RequestItem) { const data = JSON.parse(localStorage.getItem('aiflow-demo') || JSON.stringify(demoRequests)) as RequestItem[]; localStorage.setItem('aiflow-demo', JSON.stringify(data.map(x => x.id === id ? next : x))); setItem(next); }
    if (!item)
        return <div className="detail"><h1>{t("Request not found.")}</h1><Link href="/dashboard?demo=1">{t("Back to demo \u2192")}</Link></div>;
    const r = item;
    return <div className="detail"><Link href={'/dashboard' + (demo ? '?demo=1' : '')} style={{ fontSize: 12, color: 'var(--muted)' }}>{t("\u2190 Back to queue")}</Link><h1>{requestText(r, 'title', demo)}</h1><div className="cta-row"><span className="tag">{t(r.status.replace('_', ' '))}</span><span className="tag">{t(r.category)}</span><span className="tag">{t("Priority")} : {t(r.priority)}</span></div>{message && <p role="status" className="notice">{t(message)}</p>}<section className="detail-box"><h3>{t("Brief")}</h3><p>{requestText(r, 'description', demo)}</p><h3 style={{ marginTop: 25 }}>{t("What success looks like")}</h3><p>{r.success ? (requestText(r, 'success', demo)) : t('We’ll clarify this together.')}</p>{r.links && <><h3 style={{ marginTop: 25 }}>{t("Links / references")}</h3><p>{r.links}</p></>}{r.status === 'queued' && !admin && <div className="cta-row" style={{ marginTop: 25 }}><Button variant="outline" onClick={() => setEdit(true)}>{t("Edit request")}</Button><Button variant="ghost" disabled={busy} onClick={() => { if (!confirm(t("Delete this queued request?")))
        return; void run(async () => { if (demo) {
        const data = JSON.parse(localStorage.getItem('aiflow-demo') || JSON.stringify(demoRequests)) as RequestItem[];
        localStorage.setItem('aiflow-demo', JSON.stringify(data.filter(x => x.id !== id)));
    }
    else
        await deleteRequest(id); router.push('/dashboard' + (demo ? '?demo=1' : '')); }); }}>{t("Delete request")}</Button></div>}</section>
    {admin && <section className="detail-box"><h3>{t("Delivery controls")}</h3><div className="cta-row">{(['queued', 'in_progress', 'completed'] as Status[]).map(s => <Button key={s} variant="outline" disabled={busy || r.status === s} onClick={() => run(async () => { await changeStatus(id, s); })}>{t(s.replace('_', ' '))}</Button>)}</div><form action={form => run(() => adminMetadata(id, form))}><div className="two-fields"><label className="field">{t("Priority")}<select name="priority" defaultValue={r.priority}>{['Low', 'Normal', 'High'].map(x => <option key={x} value={x}>{t(x)}</option>)}</select></label><label className="field">{t("Complexity")}<select name="complexity" defaultValue={r.complexity}>{['Small', 'Medium', 'Large'].map(x => <option key={x} value={x}>{t(x)}</option>)}</select></label></div><label className="field">{t("Tags (comma-separated)")}<input name="tags" defaultValue={r.tags.join(', ')}/></label><Button disabled={busy}>{t("Save metadata")}</Button></form><form action={f => run(() => addDeliverable(id, String(f.get('url')), String(f.get('title'))))}><label className="field">{t("Deliverable title")}<input name="title" required/></label><label className="field">{t("Deliverable URL")}<input name="url" type="url" required placeholder="https://…"/></label><Button disabled={busy}>{t("Add deliverable link")}</Button></form><form action={f => run(() => uploadFile(id, f, true))}><label className="field">{t("Upload deliverable")}<input name="file" type="file" required/></label><Button disabled={busy}>{t("Upload deliverable")}</Button></form></section>}
    <section className="detail-box"><h3>{t("Files & deliverables")}</h3>{!files.length && !deliverables.length && <p>{t("No files yet.")}</p>}{[...files, ...deliverables].map(a => <div className="comment" key={a.id}><button className="button ghost" disabled={busy} onClick={() => run(async () => { const url = a.url || (a.path ? await fileLink(a.path) : ''); if (url)
        window.location.href = url; })}>{a.title || a.name} ↗</button>{a.title && !admin && <Button variant="outline" className="small" disabled={busy || !!a.approved_at} onClick={() => run(async () => { await approve(a.id); })}>{a.approved_at ? t("Approved") : t("Approve deliverable")}</Button>}</div>)}<form action={f => run(async () => { if (demo) {
        setMessage(t("File uploads are available in a subscribed workspace."));
        return;
    } await uploadFile(id, f); })}><label className="field">{t("Add a file (up to 10 MB)")}<input type="file" name="file" required/></label><Button variant="outline" disabled={busy}>{t("Upload file")}</Button></form>{r.status === 'completed' && !admin && <div style={{ marginTop: 20 }}><Button variant="outline" onClick={() => setRev(!rev)}>{t("Request a revision")}</Button>{rev && <form action={f => run(async () => { const note = String(f.get('note')); if (demo) {
        saveDemo({ ...r, status: 'queued', position: -1 });
        setMessage(t("Revision added to the front of your queue."));
    }
    else
        await revision(id, note); setRev(false); })}><label className="field">{t("What should change?")}<textarea name="note" required maxLength={10000}/></label><Button disabled={busy}>{t("Send revision request")}</Button></form>}</div>}</section>
    <section className="detail-box"><h3>{t("Conversation")}</h3>{comments.map(c => <div className="comment" key={c.id}><p>{c.body}</p><small style={{ color: 'var(--muted)' }}>{new Date(c.created_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</small></div>)}{!comments.length && <p>{t("Questions, context and updates, all in one place.")}</p>}<form action={f => run(async () => { const body = String(f.get('body')); if (demo) {
        const next = [...comments, { id: crypto.randomUUID(), body, author_id: 'demo', created_at: new Date().toISOString() }];
        setComments(next);
        localStorage.setItem('aiflow-comments-' + id, JSON.stringify(next));
    }
    else
        await addComment(id, body); })}><label className="field">{t("Your comment")}<textarea name="body" required maxLength={10000} placeholder={t("Share an update\u2026")}/></label><Button disabled={busy}>{t("Send comment")}</Button></form></section><section className="detail-box"><h3>{t("Activity")}</h3><p>{t("Created ")}{new Date(r.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</p>{events.map(e => <p key={e.id}>{e.body} · {new Date(e.created_at).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB')}</p>)}</section>{edit && <RequestForm item={r} onClose={() => setEdit(false)} onSubmit={async (f) => { if (demo)
        saveDemo({ ...r, title: String(f.get('title')), description: String(f.get('description')), success: String(f.get('success')), category: String(f.get('category')), priority: String(f.get('priority')), links: String(f.get('links')) });
    else
        await editRequest(id, f); router.refresh(); }}/>}</div>;
}
