import { Card, Icon, type IconName } from '@shared/components/ui';

/** The three-line summary before the clauses (design `.tldr`): gold-framed, an icon per line. */
export function TldrCard({
  title,
  lines,
  icons,
}: {
  title: string;
  lines: [string, string, string];
  icons: [IconName, IconName, IconName];
}) {
  return (
    <Card tone="gold" className="grid gap-3 p-[18px] lg:p-[22px]" data-testid="legal-tldr">
      <p className="text-[13.5px] leading-[1.3] font-semibold tracking-[0.02em] text-gold en:text-xs en:tracking-[0.12em] en:uppercase light:text-gold-lo">
        {title}
      </p>
      <ul className="grid gap-3">
        {lines.map((line, index) => (
          <li key={line} className="flex items-start gap-3 text-[14.5px] leading-[1.6]">
            <Icon name={icons[index] ?? 'check'} tone="gold" size={22} className="mt-px shrink-0" />
            <span className="min-w-0 flex-1 text-foreground">{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
