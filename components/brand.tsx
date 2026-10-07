import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { site } from '@/config/site';
export function Brand(){return <Link href="/" className="brand"><span className="brand-mark"><ArrowUpRight size={23}/></span>{site.brand}<span style={{color:'#859477',fontWeight:400}}>.</span></Link>}
