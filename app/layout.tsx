import type { Metadata } from 'next';
import './globals.css';
import { site } from '@/config/site';
export const metadata:Metadata={metadataBase:new URL(site.domain),title:{default:`${site.brand} — ${site.tagline}`,template:`%s — ${site.brand}`},description:'Unlimited AI, automation and development requests. One at a time. One fixed monthly subscription.',openGraph:{title:site.tagline,description:'Your on-demand AI & automation team.',type:'website',siteName:site.brand}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
