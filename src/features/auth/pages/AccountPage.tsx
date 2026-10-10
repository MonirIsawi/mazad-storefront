'use client';

import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { PageLoader, ErrorState } from '@shared/components/feedback';
import { ScreenHeader } from '@shared/components/layout';
import { Badge, Button, Card, Icon } from '@shared/components/ui';
import { ListRow } from '@shared/components/ios';
import { useLocale, useTheme } from '@shared/hooks';
import { isolatePhone } from '@shared/lib';
import { useAuthTranslation } from '../hooks/useAuthTranslation';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLogout } from '../hooks/useLogout';
import { DeleteAccountSection } from '../components/DeleteAccountSection';

export function AccountPage() {
  const { t, isReady } = useAuthTranslation();
  const { t: tCommon } = useTranslation('common');
  const { data: user, isPending, isError, refetch } = useCurrentUser();
  const { locale, changeLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const logout = useLogout();

  if (!isReady || isPending) return <PageLoader />;
  if (isError || !user) return <ErrorState onRetry={() => void refetch()} />;

  return (
    <>
      <ScreenHeader title={t('account.title')} isRoot />

      <div className="flex flex-col gap-4 px-gutter pb-6">
        <Card isInset className="flex items-center gap-3">
          <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
            <Icon name="user-round" size={26} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="truncate text-title-3 font-bold text-foreground">{user.fullName}</p>
            <p className="text-footnote text-muted-foreground tabular-nums">
              {user.phone ? isolatePhone(user.phone) : null}
            </p>
          </div>
          {user.isVerified ? (
            <Badge tone="live" className="shrink-0">
              {t('account.verified')}
            </Badge>
          ) : null}
        </Card>

        {/* Selling gets its own group: every customer can sell, but it's a different job from
            the buying rows below and shouldn't be buried among them. */}
        <Card hasShadow className="overflow-hidden">
          <ListRow icon="store" title={t('account.selling')} href={ROUTES.selling} isLast />
        </Card>

        <Card hasShadow className="overflow-hidden">
          <ListRow icon="gavel" title={t('account.myBids')} href={ROUTES.myBids} />
          <ListRow icon="badge-check" title={t('account.wins')} href={ROUTES.wins} />
          <ListRow icon="package" title={t('account.orders')} href={ROUTES.orders} />
          <ListRow icon="credit-card" title={t('account.payments')} href={ROUTES.payments} />
          <ListRow icon="heart" title={t('account.watchlist')} href={ROUTES.watchlistList} />
          <ListRow icon="store" title={t('account.following')} href={ROUTES.following} />
          <ListRow icon="map-pin" title={t('account.addresses')} href={ROUTES.addressesList} />
          <ListRow
            icon="bell"
            title={tCommon('nav.notifications')}
            href={ROUTES.notifications}
            isLast
          />
        </Card>

        <Card hasShadow className="overflow-hidden">
          <ListRow icon="eye" title={t('account.help')} href={ROUTES.help} isLast />
        </Card>

        {/* Preferences toggle in place rather than pushing a screen — one tap, no navigation. */}
        <Card hasShadow className="overflow-hidden">
          <ListRow
            icon={theme === 'dark' ? 'moon' : 'sun'}
            iconTone="fill"
            title={tCommon('theme.label')}
            value={theme === 'dark' ? tCommon('theme.dark') : tCommon('theme.light')}
            hasChevron={false}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
          <ListRow
            icon="eye"
            iconTone="fill"
            title={tCommon('locale.label')}
            value={locale === 'ar' ? tCommon('locale.ar') : tCommon('locale.en')}
            hasChevron={false}
            isLast
            onClick={() => changeLocale(locale === 'ar' ? 'en' : 'ar')}
          />
        </Card>

        <Button
          variant="gray"
          size="lg"
          isFullWidth
          isLoading={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t('account.signOut')}
        </Button>

        <DeleteAccountSection />
      </div>
    </>
  );
}
