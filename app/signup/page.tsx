import { getTranslations } from '@/lib/i18n/server';
import { Navigation } from '@/components/navigation';
import { AuthForm } from '@/components/auth-form';
export default async function Page() { const { t, locale } = await getTranslations(); return <><Navigation /><main className="auth"><h1>{t("Let\u2019s get to work.")}</h1><p>{t("Create your account, then choose your subscription.")}</p><AuthForm mode="signup"/></main></>; }
