'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@shared/hooks';
import { BrandLockup } from '@shared/components/brand';

export interface FooterColumn {
  title: string;
  links: { href: string; label: string }[];
}

/**
 * The desktop footer (design `.df`): the lockup and promise, then link columns. Columns come from
 * app/, which knows which destinations exist (a link to an unavailable feature is left out).
 */
export function SiteFooter({ columns }: { columns: FooterColumn[] }) {
  const { t } = useTranslation('common');
  const { locale } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 hidden border-t border-border bg-background-deep pt-10 pb-[34px] lg:block">
      <div className="mx-auto grid max-w-page px-10 grid-cols-[1.4fr_repeat(3,1fr)] gap-[30px]">
        <div className="grid content-start gap-3">
          <BrandLockup />
          <p className="max-w-[38ch] text-[13px] text-foreground-soft">{t('footer.promise')}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3 text-[13px] font-semibold text-foreground">{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-1 text-[13.5px] text-foreground-soft hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-full flex justify-between gap-5 border-t border-border pt-[18px] text-[12.5px] text-muted-foreground">
          <span>{t('footer.copyright', { year: String(year) })}</span>
          <span>
            {locale === 'ar' ? t('locale.ar') : t('locale.en')} · {t('footer.country')} ·{' '}
            {t('footer.currency')}
          </span>
        </div>
      </div>
    </footer>
  );
}
