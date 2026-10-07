import { getTranslations } from '@/lib/i18n/server';
import Link from 'next/link';
export default async function NotFound() { const { t, locale } = await getTranslations(); return <main className="auth"><h1>{t("Page not found.")}</h1><p>{t("This page may not exist, or you don\u2019t have access.")}</p><Link href="/dashboard" className="button primary">{t("Back to workspace")}</Link></main>; }
