'use client';

import { createContext, useContext } from 'react';
import { translator, type Locale } from '@/lib/i18n/shared';
import { demoRequests } from '@/lib/demo';
import type { RequestItem } from '@/lib/types';

const LanguageContext = createContext<Locale>('en');

export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const locale = useContext(LanguageContext);
  const t = translator(locale);
  function requestText(item: RequestItem, field: 'title' | 'description' | 'success', demo: boolean) {
    const original = demoRequests.find(request => request.id === item.id);
    return demo && original?.[field] === item[field] ? t(item[field]) : item[field];
  }
  return { locale, t, requestText };
}
