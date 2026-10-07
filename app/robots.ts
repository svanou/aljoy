import { site } from '@/config/site';export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/dashboard','/admin','/api','/auth']},sitemap:`${site.domain}/sitemap.xml`}}
