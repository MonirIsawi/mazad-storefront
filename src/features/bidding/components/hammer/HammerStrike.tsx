'use client';

import { useEffect, useState } from 'react';
import { useBiddingTranslation } from '../../hooks/useBiddingTranslation';
import styles from './HammerStrike.module.css';

/** Auctions whose hammer already fell in this tab: the moment plays once, not on every visit. */
const STRUCK = new Set<string>();
const DURATION_MS = 3200;
const STILL_MS = 1600;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * The win arrives with the hammer (design `auction-won`): the gavel lands, the SOLD stamp slams
 * down, once. Decorative and silent: no sound asset exists, so there is none. With reduced motion
 * the stamp just shows for a moment, without the swing.
 */
export function HammerStrike({ auctionId }: { auctionId: string }) {
  const { t } = useBiddingTranslation();
  const [mode, setMode] = useState<'off' | 'play' | 'still'>('off');

  useEffect(() => {
    if (STRUCK.has(auctionId)) return undefined;
    STRUCK.add(auctionId);
    const isStill = prefersReducedMotion();
    const start = setTimeout(() => setMode(isStill ? 'still' : 'play'), 0);
    const stop = setTimeout(() => setMode('off'), isStill ? STILL_MS : DURATION_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [auctionId]);

  if (mode === 'off') return null;

  return (
    <div
      aria-hidden
      data-surface="dark"
      className={`${styles.fx} ${mode === 'still' ? styles.still : ''}`}
      data-testid="hammer-strike"
    >
      <svg viewBox="0 0 400 400">
        <defs>
          <radialGradient id="hammer-flash">
            <stop offset="0" className="[stop-color:var(--color-gold-hi)]" stopOpacity="0.95" />
            <stop offset="1" className="[stop-color:var(--color-gold)]" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className={styles.flash} cx="190" cy="236" r="120" fill="url(#hammer-flash)" />
        <circle className={styles.ring} cx="190" cy="236" r="26" />
        <g className={styles.block}>
          <rect x="130" y="244" width="120" height="26" rx="7" fill="url(#bdCylV)" />
          <rect x="146" y="234" width="88" height="14" rx="5" fill="url(#bdCylV)" />
        </g>
        <g className={styles.gavel}>
          <g transform="translate(190 177) rotate(-90)">
            <use
              href="#bdGavKO"
              className="fill-background stroke-background"
              strokeWidth={8}
              strokeLinejoin="round"
            />
            <path d="M-7 32H7L5.5 160L0 200L-5.5 160Z" fill="url(#bdCyl)" />
            <rect x="-9" y="20" width="18" height="12" rx="2" fill="url(#bdCyl)" />
            <rect x="-44" y="-20" width="88" height="40" rx="4" fill="url(#bdCylV)" />
            <rect x="-56" y="-25" width="14" height="50" rx="4" fill="url(#bdCylV)" />
            <rect x="42" y="-25" width="14" height="50" rx="4" fill="url(#bdCylV)" />
          </g>
        </g>
      </svg>
      <div className={styles.stamp}>
        <b>{t('won.stamp')}</b>
        <span>SOLD · BIDOOM</span>
      </div>
    </div>
  );
}
