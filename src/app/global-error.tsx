'use client';

import { useEffect } from 'react';
import { Icon } from '@shared/components/ui';
import './styles/globals.css';

const BUTTON =
  'inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full px-6 text-[15px] font-semibold';

/**
 * The last resort, when the root layout itself failed: it replaces the whole document, so there
 * are no providers, no stored language or theme, no fonts and no i18n here. Both languages are
 * shown, Arabic (the default) first, in the Bidoom dark look (the default theme), with links that
 * reload the app from scratch.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-background text-foreground">
        <title>حدث خطأ — Something went wrong</title>
        <main
          role="alert"
          className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-8 text-center"
        >
          <span
            aria-hidden
            className="mb-2 grid size-[120px] place-items-center rounded-full border border-border-strong bg-surface bg-[radial-gradient(circle_at_50%_35%,var(--color-gold-soft),transparent_70%)] text-gold"
          >
            <Icon name="warning" size={44} />
          </span>
          <p className="text-[22px] font-semibold">حدث خطأ ما.</p>
          <p className="text-[15px] leading-[1.7] text-foreground-soft">
            تعذّر فتح بيدوم الآن. حاول مرة أخرى بعد قليل.
          </p>
          <p className="mt-2 text-[22px] font-semibold" lang="en" dir="ltr">
            Something went wrong.
          </p>
          <p className="text-[15px] leading-[1.7] text-foreground-soft" lang="en" dir="ltr">
            Bidoom couldn&apos;t open right now. Please try again in a moment.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={retry}
              className={`${BUTTON} bg-grad text-gold-ink shadow-gold`}
            >
              إعادة المحاولة · Try again
            </button>
            {/* A plain link: a full reload, since the app shell itself is what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className={`${BUTTON} border border-border-strong bg-surface-raised text-foreground`}
            >
              الرئيسية · Home
            </a>
          </div>
          <p className="mt-6 text-[13px] text-muted-foreground">بيدوم · Bidoom</p>
        </main>
      </body>
    </html>
  );
}
