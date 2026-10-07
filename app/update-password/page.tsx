import { getTranslations } from '@/lib/i18n/server';
import { AuthForm } from '@/components/auth-form';
export default async function Page() { const { t, locale } = await getTranslations(); return <main className="auth"><h1>{t("A fresh start.")}</h1><AuthForm mode="update"/></main>; }
