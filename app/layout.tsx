import type { Metadata } from 'next';
import './globals.css';
import { site } from '@/config/site';
import { getTranslations } from '@/lib/i18n/server';
import { LanguageProvider } from '@/components/language-provider';
export async function generateMetadata(): Promise<Metadata> {
  const { t, locale } = await getTranslations();
  return {metadataBase:new URL(site.domain),title:{default:`${site.brand}, ${t(site.tagline)}`,template:`%s, ${site.brand}`},description:t('Unlimited AI, automation and development requests. One at a time. One fixed monthly subscription.'),openGraph:{title:t(site.tagline),description:t('Your on-demand AI & automation team.'),type:'website',siteName:site.brand,locale:locale === 'fr' ? 'fr_FR' : 'en_GB',images:[{url:`/opengraph-image?lang=${locale}`,alt:`${site.brand}, ${t(site.tagline)}`}]}};
}
export default async function RootLayout({children}:{children:React.ReactNode}){
  const { locale } = await getTranslations();
  return <html lang={locale}><body><LanguageProvider locale={locale}>{children}</LanguageProvider></body></html>;
}
