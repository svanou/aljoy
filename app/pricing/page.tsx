import { getTranslations } from '@/lib/i18n/server';
import { Navigation } from '@/components/navigation';
import { Pricing } from '@/components/pricing';
export default async function Page() { const { t, locale } = await getTranslations(); return <><Navigation /><main className="container"><Pricing /></main></>; }

export async function generateMetadata() { const {t} = await getTranslations(); return {title:t('Pricing'),description:t('Your AI team from €2,990 per month. Unlimited requests, one active request at a time.')}; }
