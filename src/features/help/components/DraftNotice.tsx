import { Icon } from '@shared/components/ui';

/** The legal-draft notice (design `.notice`): stays until legal review signs the page off. */
export function DraftNotice({ text }: { text: string }) {
  return (
    <p
      role="note"
      data-testid="help-draft"
      className="flex gap-2.5 rounded-[18px] bg-warning-soft px-3.5 py-3 text-[13.5px] leading-[1.6] text-warning"
    >
      <Icon name="warning" size={18} className="mt-0.5 shrink-0" />
      <span className="min-w-0 flex-1 text-pretty">{text}</span>
    </p>
  );
}
