import { getTranslations } from '@/lib/i18n/server';
import { Navigation } from '@/components/navigation';
import { AuthForm } from '@/components/auth-form';
export default async function Page() { const { t, locale } = await getTranslations(); return <><Navigation /><main className="auth"><h1>{t("Welcome back.")}</h1><p>{t("Your next idea is waiting.")}</p><AuthForm mode="login"/></main></>; }

export async function generateMetadata() { const {t} = await getTranslations(); return {title:t('Client login'),description:t('Sign in to your AIflow workspace.')}; }
