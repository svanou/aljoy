'use client';
import { useLanguage } from '@/components/language-provider';
import { useState } from 'react';
import Link from 'next/link';
import { authenticate } from '@/app/auth/actions';
import { Button } from './ui/button';
export function AuthForm({ mode }: {
    mode: 'login' | 'signup' | 'reset' | 'update';
}) { const { t, locale } = useLanguage(); const [busy, setBusy] = useState(false); const [result, setResult] = useState<{
    error?: string;
    message?: string;
}>({}); return <form action={async (form) => { setBusy(true); try {
    setResult(await authenticate(form));
}
finally {
    setBusy(false);
} }}><input type="hidden" name="mode" value={mode}/>{mode === 'signup' && <label className="field">{t("First name")}<input name="first_name" autoComplete="given-name" required maxLength={80}/></label>}{mode !== 'update' && <label className="field">{t("Email")}<input type="email" name="email" autoComplete="email" required/></label>}{mode !== 'reset' && <label className="field">{t("Password")}<input type="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required/></label>}{(result.error || result.message) && <p role="status" className={'notice ' + (result.error ? 'error' : '')}>{t(result.error || result.message || "")}</p>}<Button className="full" disabled={busy}>{busy ? t("Please wait\u2026") : mode === 'signup' ? t("Create your account") : mode === 'reset' ? t("Send reset link") : mode === 'update' ? t("Update password") : t("Sign in")}</Button><p>{mode === 'login' ? <><Link href="/reset-password">{t("Forgot password?")}</Link> · <Link href="/signup">{t("Create account")}</Link></> : <Link href="/login">{t("Back to sign in")}</Link>}</p><Link href="/dashboard?demo=1" className="button secondary full">{t("Explore demo workspace \u2192")}</Link></form>; }
