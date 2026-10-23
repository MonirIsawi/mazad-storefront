import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import type { HelpStepIcon } from '../content';

/**
 * Steps in the order they happen (design `.tline`): gold dots joined by a gold line, down the page
 * on phones and across it from 960px.
 */
export function HelpSteps({
  items,
  label,
}: {
  items: { icon: HelpStepIcon; text: string }[];
  label: string;
}) {
  return (
    <ol aria-label={label} className="grid lg:auto-cols-fr lg:grid-flow-col">
      {items.map((item, index) => (
        <li
          key={item.text}
          className={cn(
            'relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 pb-[18px] last:pb-0',
            'lg:grid-cols-none lg:grid-rows-[28px_auto] lg:pe-3.5 lg:pb-0',
            index < items.length - 1 &&
              'before:absolute before:start-[13px] before:top-7 before:bottom-0 before:w-0.5 before:bg-gold lg:before:start-[38px] lg:before:end-2.5 lg:before:top-[13px] lg:before:bottom-auto lg:before:h-0.5 lg:before:w-auto',
          )}
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-full bg-grad text-gold-ink"
          >
            <Icon name={item.icon} size={14} />
          </span>
          <span className="pt-0.5 text-[14.5px] leading-[1.45] font-medium text-foreground lg:pt-0">
            {item.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
