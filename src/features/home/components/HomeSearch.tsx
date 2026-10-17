'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@shared/constants';
import { SearchField } from '@shared/components/ui';
import { useHomeTranslation } from '../hooks/useHomeTranslation';

/** The phone search with its gold filter button; both land on Browse (the filters open there). */
export function HomeSearch() {
  const { t } = useHomeTranslation();
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    const q = query.trim();
    if (q) router.push(`${ROUTES.auctions}?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      role="search"
      className="lg:hidden"
      onSubmit={(event) => {
        event.preventDefault();
        handleSearch();
      }}
    >
      <SearchField
        value={query}
        onChange={setQuery}
        label={tCommon('search.label')}
        placeholder={t('search.placeholder')}
        clearLabel={tCommon('search.clear')}
        onFilter={() => router.push(`${ROUTES.auctions}?sheet=filters`)}
        filterLabel={t('search.filters')}
      />
    </form>
  );
}
