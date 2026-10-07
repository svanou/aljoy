import Image from 'next/image';

const technologies = [
  { name: 'n8n', slug: 'n8n' },
  { name: 'OpenAI', slug: 'openai' },
  { name: 'Claude', slug: 'claude' },
  { name: 'Supabase', slug: 'supabase' },
  { name: 'Stripe', slug: 'stripe' },
];

export function TechnologyLogos({ label }: { label: string }) {
  return <ul className="proof-tools" aria-label={label}>
    {technologies.map(({ name, slug }) => <li className={`technology-logo technology-logo-${slug}`} key={slug}>
      <Image src={`/logos/${slug}.svg`} alt="" width={25} height={25} />
      <span>{name}</span>
    </li>)}
  </ul>;
}
