'use client';

import { AuthGuard, AccountPage } from '@features/auth';
import { AccountOrdersPanel, useOpenOrdersCount, useOpenSalesCount } from '@features/orders';
import { useUnreadNotificationCount } from '@features/notifications';

// The account screen's live counters and its desktop column come from the features that own the
// data; the route composes them (AGENTS.md rule 1).
function AccountRoute() {
  const unread = useUnreadNotificationCount();
  const openOrders = useOpenOrdersCount();
  const openSales = useOpenSalesCount();
  return (
    <AccountPage
      counts={{ openOrders, unreadNotifications: unread.data, openSales }}
      aside={<AccountOrdersPanel />}
    />
  );
}

export default function Page() {
  return (
    <AuthGuard>
      <AccountRoute />
    </AuthGuard>
  );
}
