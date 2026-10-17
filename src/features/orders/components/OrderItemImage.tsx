import Image from 'next/image';
import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';

/** A product photo in an order, or the package placeholder when there is none. */
export function OrderItemImage({
  src,
  alt,
  sizePx,
  className,
}: {
  src: string | null;
  alt: string;
  sizePx: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[18px] border border-border bg-surface-raised',
        className,
      )}
      style={{ width: sizePx, height: sizePx }}
      data-testid="order-item-image"
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${sizePx}px`} className="object-cover" />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center text-muted-foreground"
          role="img"
          aria-label={alt}
        >
          <Icon name="package" size={Math.round(sizePx * 0.4)} />
        </span>
      )}
    </div>
  );
}
