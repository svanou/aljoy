'use client';
import { useLanguage } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: {
    reset: () => void;
}) { const { t, locale } = useLanguage(); return <main className="auth"><h1>{t("Couldn\u2019t load this page.")}</h1><p>{t("Please try again. Your work is saved.")}</p><Button onClick={reset}>{t("Try again")}</Button></main>; }
