import type { ElementType, ReactNode } from 'react';
import { cn } from '@shared/lib';

/**
 * The page column (design `.wrap`): a 20px gutter on phones; from 960px, up to 1600px wide (the header's width too) and
 * centred with 40px gutters.
 */
export function PageContainer({
  as: Tag = 'div',
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={cn('mx-auto w-full max-w-page px-5 lg:px-10', className)}>{children}</Tag>;
}
