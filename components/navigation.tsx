import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from './brand';
import { Button } from './ui/button';
export function Navigation(){return <header className="nav-wrap"><nav className="container nav" aria-label="Main navigation"><Brand/><div className="nav-links">{['How it works','Services','Examples','Pricing','FAQ'].map(x=><a key={x} href={'/#'+x.toLowerCase().replaceAll(' ','-')}>{x}</a>)}</div><Button asChild className="small"><Link href="/signup">Get started <ArrowUpRight size={14}/></Link></Button></nav></header>}
