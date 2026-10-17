'use client';

import type { ReactNode } from 'react';
import { MenuRow } from '@shared/components/ui';
import { ROUTES } from '@shared/constants';
import { useApiFeature, useMoney } from '@shared/hooks';
import { useAuthTranslation } from '../../hooks/useAuthTranslation';
import { PreferenceRows } from './PreferenceRows';

/** A titled group of menu rows (design `.grp-t` + `.menu`). */
function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2 lg:gap-2.5">
      <h2 className="px-1.5 pt-3.5 text-[13px] font-normal text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The account's grouped menus: selling, my activity, preferences with help. "Contact us" only
 * while the API has support reports; otherwise the row isn't there at all.
 */
export function AccountMenu({ unreadNotifications }: { unreadNotifications?: number }) {
  const { t } = useAuthTranslation();
  const { number } = useMoney();
  const hasContact = useApiFeature('supportReports') === true;
  const activity = [
    { href: ROUTES.myBids, icon: 'paddle', title: t('account.myBids') },
    { href: ROUTES.wins, icon: 'trophy', title: t('account.wins') },
    { href: ROUTES.orders, icon: 'package', title: t('account.orders') },
    { href: ROUTES.payments, icon: 'wallet', title: t('account.payments') },
    { href: ROUTES.watchlistList, icon: 'heart', title: t('account.watchlist') },
    { href: ROUTES.following, icon: 'users', title: t('account.following') },
    { href: ROUTES.addressesList, icon: 'pin', title: t('account.addresses') },
  ] as const;

  return (
    <>
      <MenuGroup title={t('account.selling')}>
        <MenuRow
          href={ROUTES.selling}
          icon="store"
          title={t('account.sellerHub')}
          subtitle={t('account.sellerHubHint')}
        />
      </MenuGroup>
      <MenuGroup title={t('account.activity')}>
        {activity.map((row) => (
          <MenuRow key={row.href} href={row.href} icon={row.icon} title={row.title} />
        ))}
        <MenuRow
          href={ROUTES.notifications}
          icon="bell"
          title={t('account.notifications')}
          tail={
            unreadNotifications ? (
              <span className="font-tabular">{number(unreadNotifications)}</span>
            ) : null
          }
        />
      </MenuGroup>
      <MenuGroup title={t('account.preferences')}>
        <PreferenceRows />
        <MenuRow href={ROUTES.help} icon="question" title={t('account.help')} />
        {hasContact ? (
          <MenuRow
            href={ROUTES.contact}
            icon="telegram"
            title={t('account.contact')}
            subtitle={t('account.contactHint')}
          />
        ) : null}
      </MenuGroup>
    </>
  );
}
