'use client';

import { Icon } from '@shared/components/ui';
import { useSupportTranslation } from '../hooks/useSupportTranslation';
import type { SupportChannel } from '../lib/channels';

/** The WhatsApp glyph from the design sheet (Phosphor's whatsapp-logo, 256 grid). */
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 256 256"
      width={24}
      height={24}
      aria-hidden
      focusable={false}
      fill="currentColor"
    >
      <path
        d="M44 214l13-44a92 92 0 1 1 31 31z"
        fill="none"
        stroke="currentColor"
        strokeWidth={16}
        strokeLinejoin="round"
      />
      <path d="M100 84c-9 0-19 10-19 22 0 34 35 69 69 69 12 0 22-10 22-19 0-3-1-5-4-6l-21-10c-3-1-6 0-8 2l-8 10c-14-6-26-18-32-32l10-8c2-2 3-5 2-8l-10-21c-1-3-3-4-6-4z" />
    </svg>
  );
}

/**
 * "Need to talk?" (design `.ctc-ch`): the chat channels configured for this deployment. Reply times
 * are not shown: there is no real figure for them yet.
 */
export function ChannelList({ channels }: { channels: SupportChannel[] }) {
  const { t } = useSupportTranslation();
  if (channels.length === 0) return null;
  return (
    <section aria-labelledby="support-channels-title" className="grid gap-2.5">
      <h2 id="support-channels-title" className="text-[13px] font-normal text-foreground-soft">
        {t('channels.title')}
      </h2>
      <ul className="grid gap-2.5">
        {channels.map((channel) => (
          <li key={channel.id}>
            <a
              href={channel.href}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] border border-border bg-surface px-3.5 py-2.5 text-start hover:border-border-strong"
            >
              <span
                aria-hidden
                className={
                  channel.id === 'whatsapp'
                    ? 'grid size-11 place-items-center rounded-[14px] bg-live-soft text-live'
                    : 'grid size-11 place-items-center rounded-[14px] bg-info-soft text-info'
                }
              >
                {channel.id === 'whatsapp' ? <WhatsAppGlyph /> : <Icon name="telegram" size={24} />}
              </span>
              <span className="grid min-w-0 gap-0.5">
                <span className="font-medium text-foreground">{t(`channels.${channel.id}`)}</span>
                <span className="text-[12.5px] text-muted-foreground">
                  {t(`channels.${channel.id}Hint`)}
                  <span className="sr-only"> {t('channels.newTab')}</span>
                </span>
              </span>
              <Icon
                name="arrow-up-left"
                size={18}
                className="text-muted-foreground ltr:-scale-x-100"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
