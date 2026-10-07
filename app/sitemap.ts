import { site } from '@/config/site';export default function sitemap(){return ['','/pricing','/login'].map(path=>({url:site.domain+path,lastModified:new Date()}))}
