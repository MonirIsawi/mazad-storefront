'use client';

import { ROUTES } from '@shared/constants';
import { EmptyState, ErrorState, PageLoader } from '@shared/components/feedback';
import { PageContainer, ScreenHeader } from '@shared/components/layout';
import { Button, Skeleton } from '@shared/components/ui';
import { useLocale, useServerClock } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import { useNotifications, useMarkAllNotificationsRead } from '../hooks/useNotifications';
import { useNotificationsTranslation } from '../hooks/useNotificationsTranslation';
import { dayKey } from '../lib/notification-display';
import { NotificationRow } from '../components/NotificationRow';
import type { Notification } from '../types/notifications.types';

/**
 * Notifications grouped by day (design `notifications`): each type with its own glyph and tone,
 * unread rows with a dot, every row opening the auction or order it is about.
 */
export function NotificationsPage() {
  const { t, isReady } = useNotificationsTranslation();
  const { locale } = useLocale();
  const { now } = useServerClock();
  const notifications = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  if (!isReady) return <PageLoader />;

  const list = notifications.data ?? [];
  const hasUnread = list.some((item) => item.readAt == null);
  const groups = new Map<string, Notification[]>();
  for (const item of list) {
    const key = dayKey(item.createdAt, now());
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const groupTitle = (key: string, first: Notification) =>
    key === 'today' || key === 'yesterday' ? t(`page.${key}`) : formatDate(first.createdAt, locale);
  const markAll = (
    <Button
      variant="plain"
      size="sm"
      isLoading={markAllRead.isPending}
      onClick={() => markAllRead.mutate()}
    >
      {t('page.markAllRead')}
    </Button>
  );

  return (
    <>
      <ScreenHeader
        title={t('page.title')}
        backHref={ROUTES.account}
        crumbs={[{ label: t('page.account'), href: ROUTES.account }]}
        desktopTrailing={hasUnread ? markAll : undefined}
        actions={
          hasUnread
            ? [{ name: 'check', label: t('page.markAllRead'), onClick: () => markAllRead.mutate() }]
            : []
        }
      />
      <PageContainer className="grid max-w-[820px] gap-2 pb-12">
        {notifications.isPending ? (
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} radius="lg" className="h-[62px] w-full" />
          ))
        ) : notifications.isError ? (
          <ErrorState onRetry={() => void notifications.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState icon="bell" title={t('page.emptyTitle')} message={t('page.empty')} />
        ) : (
          [...groups.entries()].map(([key, items]) => (
            <section key={key} className="grid gap-2 lg:gap-2.5">
              <h2 className="px-1.5 pt-3.5 text-[13px] font-normal text-muted-foreground">
                {groupTitle(key, items[0]!)}
              </h2>
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  notification={item}
                  isToday={key === 'today' || key === 'yesterday'}
                />
              ))}
            </section>
          ))
        )}
      </PageContainer>
    </>
  );
}
