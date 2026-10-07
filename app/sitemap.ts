import { site } from '@/config/site';
export default function sitemap() {
  return ['', '/pricing', '/login'].flatMap(path => ['en', 'fr'].map(lang => ({
    url: `${site.domain}${path}?lang=${lang}`,
    alternates: {languages: {en: `${site.domain}${path}?lang=en`, fr: `${site.domain}${path}?lang=fr`}},
  })));
}
