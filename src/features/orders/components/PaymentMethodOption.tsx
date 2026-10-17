import { Icon, type IconName } from '@shared/components/ui';
import { cn } from '@shared/lib';

/** A payment method choice (design `.radio`): a real radio input under the check circle. */
export function PaymentMethodOption({
  checked,
  onSelect,
  title,
  hint,
  icon,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
  icon: IconName;
}) {
  return (
    <label
      className={cn(
        'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border px-4 py-3.5',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold',
        checked ? 'border-gold-line bg-gold-soft' : 'border-border-strong bg-surface',
      )}
    >
      <input
        type="radio"
        name="payment-method"
        className="peer sr-only"
        checked={checked}
        onChange={onSelect}
      />
      <span
        aria-hidden
        className={cn(
          'grid size-6 place-items-center rounded-full',
          checked ? 'bg-grad text-gold-ink' : 'border-[1.5px] border-border-strong',
        )}
      >
        {checked ? <Icon name="check" size={14} /> : null}
      </span>
      <span className="grid min-w-0">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-xs leading-[1.5] text-muted-foreground">{hint}</span>
      </span>
      <Icon name={icon} size={22} className="text-foreground-soft" />
    </label>
  );
}
