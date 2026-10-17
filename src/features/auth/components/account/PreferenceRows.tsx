'use client';

import { useTranslation } from 'react-i18next';
import { MenuRow } from '@shared/components/ui';
import { useLocale, useTheme } from '@shared/hooks';
import { ChoiceSegment } from './ChoiceSegment';

/**
 * Appearance and Language, switched in place. Dark and Light are the only themes today (Dark is
 * the default); the choice stays in the existing per-device theme store.
 */
export function PreferenceRows() {
  const { t } = useTranslation('common');
  const { theme, setTheme } = useTheme();
  const { locale, changeLocale } = useLocale();
  return (
    <>
      <MenuRow
        icon={theme === 'dark' ? 'moon' : 'sun'}
        title={t('theme.label')}
        hasChevron={false}
        tail={
          <ChoiceSegment
            label={t('theme.label')}
            value={theme}
            onChange={setTheme}
            choices={[
              { id: 'dark', label: t('theme.dark') },
              { id: 'light', label: t('theme.light') },
            ]}
          />
        }
      />
      <MenuRow
        icon="globe"
        title={t('locale.label')}
        hasChevron={false}
        tail={
          <ChoiceSegment
            label={t('locale.label')}
            value={locale}
            onChange={changeLocale}
            choices={[
              { id: 'ar', label: t('locale.ar'), lang: 'ar' },
              { id: 'en', label: t('locale.en'), lang: 'en' },
            ]}
          />
        }
      />
    </>
  );
}
