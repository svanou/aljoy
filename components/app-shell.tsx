'use client';
import { LanguageSwitcher } from './language-switcher';
import { useLanguage } from '@/components/language-provider';
import Link from 'next/link';
import { Brand } from './brand';
import { site } from '@/config/site';
import { logout } from '@/app/auth/actions';
export function AppShell({ children, demo = false, admin = false }: {
    children: React.ReactNode;
    demo?: boolean;
    admin?: boolean;
}) { const { t, locale } = useLanguage(); return <>{demo && <div className="demo-banner">{t("Demo workspace \u00B7 Sample data, no subscription or live delivery. ")}<Link href="/signup"><u>{t("Create your account \u2197")}</u></Link></div>}<div className="app-shell"><aside className="sidebar"><Brand /><nav className="side-links"><Link className={!admin ? 'selected' : ''} href={'/dashboard' + (demo ? '?demo=1' : '')}>{t("\u25A6 My workspace")}</Link>{(admin || demo) && <Link className={admin ? 'selected' : ''} href={'/admin' + (demo ? '?demo=1' : '')}>{t("\u2197 Work queue")}</Link>}<Link href="/pricing">{t("\u25C8 Subscription")}</Link></nav><div className="side-bottom"><p>{t("Need a hand?")}</p><a href={`mailto:${site.email}`}>{site.email}</a></div></aside><main className="app-main"><div className="app-top"><span>{admin ? t("AIflow / Admin") : t("Workspace / Overview")}</span><div className="app-top-actions"><LanguageSwitcher />{demo ? <span>{t("Demo member")}</span> : <form action={logout}><button className="button ghost small">{t("Sign out")}</button></form>}</div></div>{children}</main></div></>; }
