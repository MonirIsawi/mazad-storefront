'use client';

import { StateBanner, type IconName, type StateTone } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useBiddingTranslation } from '../hooks/useBiddingTranslation';
import type { UserState } from '../lib/user-state';

type ShownState = Exclude<UserState, { kind: 'signIn' }>;

const LOOK: Record<ShownState['kind'], { tone: StateTone; icon: IconName; isFilled?: boolean }> = {
  own: { tone: 'info', icon: 'store' },
  won: { tone: 'gold', icon: 'crown', isFilled: true },
  soldToOther: { tone: 'info', icon: 'gavel' },
  ended: { tone: 'info', icon: 'clock' },
  notStarted: { tone: 'info', icon: 'calendar' },
  paused: { tone: 'bad', icon: 'warning' },
  autoBid: { tone: 'ok', icon: 'lightning', isFilled: true },
  leading: { tone: 'ok', icon: 'crown', isFilled: true },
  outbid: { tone: 'bad', icon: 'warning' },
  canBid: { tone: 'info', icon: 'gavel' },
};

/**
 * Your standing, second only to price and time (design `.state`): one banner in a fixed priority
 * (see userStateOf). Outbid names the exact amount that puts you back in front.
 */
export function StandingBanner({
  state,
  minimumBid,
}: {
  state: ShownState;
  /** The lowest bid that leads again, for the outbid banner. */
  minimumBid?: number;
}) {
  const { t } = useBiddingTranslation();
  const { money } = useMoney();
  const look = LOOK[state.kind];

  return (
    <div data-testid="auction-user-state" data-state={state.kind}>
      <StateBanner
        role={state.kind === 'outbid' || state.kind === 'paused' ? 'alert' : 'status'}
        tone={look.tone}
        icon={look.icon}
        isIconFilled={look.isFilled}
      >
        {state.kind === 'autoBid' ? (
          t('state.autoBid', { amount: money(state.maxAmount) })
        ) : state.kind === 'outbid' && minimumBid ? (
          <>
            {t('state.outbidTo')}{' '}
            <b className="font-num font-semibold">{money(String(minimumBid))}</b>
          </>
        ) : (
          t(`state.${state.kind}`)
        )}
      </StateBanner>
    </div>
  );
}
