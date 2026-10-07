import 'server-only';
import { cookies, headers } from 'next/headers';
import { localeCookie, normalizeLocale, translator } from './shared';

export async function getTranslations() {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const locale = normalizeLocale(requestHeaders.get('x-aiflow-language') ?? cookieStore.get(localeCookie)?.value);
  return { locale, t: translator(locale) };
}
