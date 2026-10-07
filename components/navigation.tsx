'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
import { useLanguage } from './language-provider';
import { LanguageSwitcher } from './language-switcher';

export function Navigation() {
  const { t } = useLanguage();
  const links = [['How it works', 'how-it-works'], ['Services', 'services'], ['Examples', 'examples'], ['Pricing', 'pricing'], ['FAQ', 'faq']];
  return <header className="nav-wrap"><nav className="container nav" aria-label={t('Main navigation')}>
    <Brand />
    <div className="nav-links">{links.map(([label, anchor]) => <a key={anchor} href={`/#${anchor}`}>{t(label)}</a>)}</div>
    <div className="nav-actions"><LanguageSwitcher /><Button asChild className="small"><Link href="/signup">{t('Get started')} <ArrowUpRight size={14} /></Link></Button></div>
  </nav></header>;
}
