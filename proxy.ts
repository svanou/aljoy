import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { localeCookie, normalizeLocale } from '@/lib/i18n/shared';

export async function proxy(req: NextRequest) {
  const selected = req.nextUrl.searchParams.get('lang');
  const locale = normalizeLocale(selected === 'en' || selected === 'fr' ? selected : req.cookies.get(localeCookie)?.value);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-aiflow-language', locale);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const needsAuth = /^\/(dashboard|admin)(\/|$)/.test(req.nextUrl.pathname) || ['/login', '/signup', '/update-password'].includes(req.nextUrl.pathname);
  if (needsAuth && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: list => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          requestHeaders.set('cookie', req.headers.get('cookie') || '');
          response = NextResponse.next({ request: { headers: requestHeaders } });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await db.auth.getUser();
  }

  if (selected === 'en' || selected === 'fr') {
    response.cookies.set(localeCookie, locale, { path: '/', maxAge: 31536000, sameSite: 'lax', httpOnly: true, secure: req.nextUrl.protocol === 'https:' });
  }
  return response;
}

export const config = { matcher: ['/((?!api|_next|favicon.ico|.*\\..*).*)'] };
