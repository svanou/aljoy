'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from './language-provider';

export function LanguageSwitcher() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const search = useSearchParams();

  function href(language: 'en' | 'fr') {
    const params = new URLSearchParams(search.toString());
    params.set('lang', language);
    return `${pathname}?${params.toString()}`;
  }

  return <nav className="language-switcher" aria-label={locale === 'fr' ? 'Langue' : 'Language'}>
    <a href={href('fr')} lang="fr" aria-label="Français" aria-current={locale === 'fr' ? 'true' : undefined}>FR</a>
    <span aria-hidden="true">/</span>
    <a href={href('en')} lang="en" aria-label="English" aria-current={locale === 'en' ? 'true' : undefined}>EN</a>
  </nav>;
}
