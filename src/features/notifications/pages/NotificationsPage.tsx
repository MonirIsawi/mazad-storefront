'use client';

import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Button, Card, Icon, Skeleton, type IconName } from '@shared/components/ui';
import { useLocale } from '@shared/hooks';
import { cn, formatDateTime } from '@shared/lib';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../hooks/useNotifications';
import { useNotificationsTranslation } from '../hooks/useNotificationsTranslation';
import type { Notification, NotificationType } from '../types/notifications.types';

// One glyph per notification family, from the vendored Lucide set — never an emoji.
const TYPE_ICON: Record<NotificationType, IconName> = {
  OUTBID: 'trending-up',
  AUCTION_ENDING_SOON: 'clock',
  AUCTION_EXTENDED: 'clock',
  AUCTION_WON: 'badge-check',
  WIN_EXPIRING_SOON: 'clock',
  WIN_PASSED_TO_YOU: 'badge-check',
  AUCTION_APPROVED: 'check',
  AUCTION_REJECTED: 'x',
  ORDER_STATUS_CHANGED: 'package',
  NEW_BID_ON_YOUR_AUCTION: 'gavel',
  RETURN_REQUESTED: 'package',
  RETURN_STATUS_CHANGED: 'package',
  FOLLOWED_SELLER_NEW_AUCTION: 'store',
  WATCHED_AUCTION_STARTING: 'heart',
  ADMIN_AUCTION_PENDING: 'bell',
  ADMIN_RETURN_REQUESTED: 'bell',
};

export function NotificationsPage() {
  const { t, isReady } = useNotificationsTranslation();
  const notifications = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  if (!isReady) return <PageLoader />;

  const hasUnread = (notifications.data ?? []).some((item) => item.readAt == null);

  return (
    <>
      <ScreenHeader title={t('page.title')} backHref={ROUTES.account} />

      <div className="flex flex-col gap-3 px-gutter pb-6">
        {hasUnread ? (
          <Button
            variant="plain"
            size="sm"
            className="self-start"
            isLoading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {t('page.markAllRead')}
          </Button>
        ) : null}

        {notifications.isPending ? (
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-16 w-full" />
          ))
        ) : notifications.isError ? (
          <ErrorState onRetry={() => void notifications.refetch()} />
        ) : notifications.data.length === 0 ? (
          <EmptyState icon="bell" title={t('page.emptyTitle')} message={t('page.empty')} />
        ) : (
          <Card className="overflow-hidden">
            {notifications.data.map((item, index) => (
              <NotificationRow
                key={item.id}
                notification={item}
                isLast={index === notifications.data.length - 1}
              />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

function NotificationRow({
  notification,
  isLast,
}: {
  notification: Notification;
  isLast: boolean;
}) {
  const { locale } = useLocale();
  const markRead = useMarkNotificationRead();

  const isUnread = notification.readAt == null;
  const title = locale === 'ar' ? notification.titleAr : notification.titleEn;
  const body = locale === 'ar' ? notification.bodyAr : notification.bodyEn;

  return (
    <button
      type="button"
      onClick={() => (isUnread ? markRead.mutate(notification.id) : undefined)}
      className={cn(
        'flex w-full items-start gap-3 p-4 text-start transition-colors duration-fast ease-ios active:bg-fill',
        !isLast && 'border-b border-separator',
        isUnread && 'bg-primary-tint/40',
      )}
    >
      <span
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-sm',
          isUnread ? 'bg-primary-tint text-primary' : 'bg-fill text-foreground-soft',
        )}
      >
        <Icon name={TYPE_ICON[notification.type]} size={18} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn('text-subhead text-foreground', isUnread ? 'font-semibold' : 'font-medium')}
        >
          {title}
        </span>
        <span className="text-footnote text-muted-foreground">{body}</span>
        <span className="text-caption-2 text-muted-foreground">
          {formatDateTime(notification.createdAt, locale)}
        </span>
      </span>

      {isUnread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}
    </button>
  );
}
