'use client';

import { Chip, Icon } from '@shared/components/ui';
import { useOrdersTranslation } from '../../hooks/useOrdersTranslation';
import { MAX_REVIEW_TAGS, tagsForRating } from '../../lib/review-rules';

/**
 * Quick tags that follow the stars: praise at four or five, problems at three or fewer, so a low
 * rating says what went wrong without typing. At most three.
 */
export function RateTags({
  stars,
  value,
  onChange,
}: {
  stars: number;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useOrdersTranslation();
  const isFull = value.length >= MAX_REVIEW_TAGS;
  const toggle = (tag: string) =>
    onChange(value.includes(tag) ? value.filter((one) => one !== tag) : [...value, tag]);

  return (
    <fieldset className="grid gap-2.5">
      <legend className="mb-2.5 text-sm text-foreground-soft">
        {stars >= 4 ? t('rating.wentWell') : t('rating.wentWrong')}{' '}
        <span className="text-muted-foreground">{t('rating.maxTags')}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {tagsForRating(stars).map((tag) => {
          const isOn = value.includes(tag);
          return isFull && !isOn ? (
            <span
              key={tag}
              aria-disabled
              className="inline-flex h-9 items-center rounded-full border border-border px-3.5 text-[13.5px] text-muted-foreground opacity-60"
            >
              {t(`common:reviewTags.${tag}`)}
            </span>
          ) : (
            <Chip key={tag} isActive={isOn} onClick={() => toggle(tag)}>
              {isOn ? <Icon name="check" size={15} /> : null}
              {t(`common:reviewTags.${tag}`)}
            </Chip>
          );
        })}
      </div>
    </fieldset>
  );
}
