'use client';
import { useLanguage } from '@/components/language-provider';
import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { services } from '@/config/services';
import { Button } from './ui/button';
import type { RequestItem } from '@/lib/types';
export function RequestForm({ item, onClose, onSubmit }: {
    item?: RequestItem;
    onClose: () => void;
    onSubmit: (f: FormData) => Promise<void>;
}) { const { t, locale } = useLanguage(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const dialog = useRef<HTMLDialogElement>(null); useEffect(() => { dialog.current?.showModal(); }, []); return <dialog ref={dialog} onCancel={onClose} className="modal" style={{ border: 0, margin: 'auto' }}><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(''); try {
    await onSubmit(new FormData(e.currentTarget));
    onClose();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} }}><div className="modal-head"><h3>{item ? t("Edit request") : t("Let\u2019s build something.")}</h3><button type="button" className="button ghost" onClick={onClose} aria-label={t("Close")}><X size={18}/></button></div><label className="field">{t("Title")}<input name="title" placeholder={t("What would you like us to build?")} required maxLength={160} defaultValue={item?.title} autoFocus/></label><label className="field">{t("Description")}<textarea name="description" placeholder={t("Share the context, current process and what you need.")} required maxLength={20000} defaultValue={item?.description}/></label><div className="two-fields"><label className="field">{t("Category")}<select aria-label={t("Category")} name="category" defaultValue={item?.category}>{services.map(s => <option key={s.name} value={s.name}>{t(s.name)}</option>)}</select></label><label className="field">{t("Priority")}<select aria-label={t("Priority")} name="priority" defaultValue={item?.priority || 'Normal'}>{['Low', 'Normal', 'High'].map(p => <option key={p} value={p}>{t(p)}</option>)}</select></label></div><label className="field">{t("What does success look like?")}<textarea name="success" placeholder={t("How will we know this is ready?")} required maxLength={5000} defaultValue={item?.success}/></label><label className="field">{t("Links / references")}<textarea name="links" maxLength={5000} defaultValue={item?.links} placeholder={t("Docs, examples, or existing tools")}/></label>{!item && <label className="field">{t("File upload (optional, up to 10 MB)")}<input type="file" name="file"/></label>}{error && <p className="notice error" role="alert">{t(error)}</p>}<Button className="full" disabled={busy}>{busy ? t("Saving\u2026") : item ? t("Save changes") : t("Add to queue")} <span aria-hidden="true">↗</span></Button><p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>{t("One outcome per request. We\u2019ll help you scope larger ideas.")}</p></form></dialog>; }
