'use client';
import { useLanguage } from '@/components/language-provider';
export default function Loading() {
  const { t } = useLanguage();
  return <main className="container" role="status" style={{paddingTop:80}}>{t('Loading your workspace…')}</main>;
}
