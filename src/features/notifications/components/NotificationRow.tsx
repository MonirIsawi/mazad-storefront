'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { cn, formatDate, formatTime } from '@shared/lib';
import { useMarkNotificationRead } from '../hooks/useNotifications';
import { useNotificationsTranslation } from '../hooks/useNotificationsTranslation';
import { NOTIFICATION_VISUAL, TONE_TILE, notificationHref } from '../lib/notification-display';
import type { Notification } from '../types/notifications.types';

const ROW =
  'grid min-h-[62px] w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[22px] border border-border bg-surface px-3.5 py-2.5 text-start transition-[border-color] duration-fast ease-ios hover:border-border-strong';

/** One notification (design `.mrow`): toned glyph, title and body, the time and an unread dot. */
export function NotificationRow({
  notification,
  isToday,
}: {
  notification: Notification;
  isToday: boolean;
}) {
  const { t } = useNotificationsTranslation();
  const { locale } = useLocale();
  const markRead = useMarkNotificationRead();
  const isUnread = notification.readAt == null;
  const visual = NOTIFICATION_VISUAL[notification.type];
  const href = notificationHref(notification);
  const onOpen = () => (isUnread ? markRead.mutate(notification.id) : undefined);

  const body: ReactNode = (
    <>
      <span
        aria-hidden
        className={cn('grid size-11 place-items-center rounded-[14px]', TONE_TILE[visual.tone])}
      >
        <Icon name={visual.icon} size={22} />
      </span>
      <span className="grid min-w-0 gap-0.5 leading-[1.4]">
        <span
          className={cn('text-[15px] text-foreground', isUnread ? 'font-semibold' : 'font-medium')}
        >
          {locale === 'ar' ? notification.titleAr : notification.titleEn}
        </span>
        <span className="line-clamp-2 text-[12.5px] text-muted-foreground">
          {locale === 'ar' ? notification.bodyAr : notification.bodyEn}
        </span>
      </span>
      <span className="grid justify-items-end gap-1.5 text-[13px] text-muted-foreground">
        <span className="font-tabular whitespace-nowrap">
          {isToday
            ? formatTime(notification.createdAt, locale)
            : formatDate(notification.createdAt, locale)}
        </span>
        {isUnread ? (
          <span className="size-2 rounded-full bg-gold">
            <span className="sr-only">{t('page.unread')}</span>
          </span>
        ) : null}
      </span>
    </>
  );

  return href ? (
    <Link href={href} onClick={onOpen} className={ROW}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={ROW}>
      {body}
    </button>
  );
}
