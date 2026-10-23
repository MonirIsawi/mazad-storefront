'use client';

import { Chip, FIELD_LABEL, Input } from '@shared/components/ui';
import { useMoney } from '@shared/hooks';
import { useSellingTranslation } from '../../hooks/useSellingTranslation';
import {
  EXTENSION_MINUTES,
  MAX_EXTENSIONS,
  parseDinars,
  type AuctionField,
  type AuctionFormState,
} from '../../lib/auction-payload';
import { ladderStep, stepSuggestions } from '../../lib/bid-ladder';

export interface AuctionRuleFieldsProps {
  state: AuctionFormState;
  set: <K extends AuctionField>(key: K, value: AuctionFormState[K]) => void;
  fieldError: (key: AuctionField) => string | undefined;
  /** The typed opening price in dinars, once it reads as one. */
  opening: number | null;
  onStep: (text: string) => void;
}

/**
 * The seller's bid step (input + chips around the suggested step for the opening price) and the
 * automatic extension (minutes + times), as in the design's `create-auction`.
 */
export function AuctionRuleFields({
  state,
  set,
  fieldError,
  opening,
  onStep,
}: AuctionRuleFieldsProps) {
  const { t } = useSellingTranslation();
  const { money, number } = useMoney();
  const chosen = parseDinars(state.minIncrement);
  const chosenStep = 'value' in chosen ? chosen.value : null;
  const minutes = Number(state.antiSnipingMinutes) || EXTENSION_MINUTES.default;
  const times = Number(state.maxExtensions) || MAX_EXTENSIONS.default;
  const extensionError = fieldError('antiSnipingMinutes') ?? fieldError('maxExtensions');

  return (
    <>
      <div className="grid gap-2">
        <Input
          label={t('fields.bidStep')}
          inputMode="numeric"
          className="font-tabular"
          value={state.minIncrement}
          onChange={(event) => onStep(event.target.value)}
          error={fieldError('minIncrement')}
          hint={
            opening
              ? t('fields.bidStepHint', {
                  opening: money(String(opening)),
                  step: money(String(ladderStep(opening))),
                })
              : t('fields.bidStepHintEmpty')
          }
          trailing={
            <span className="pe-3 text-sm text-muted-foreground">{t('fields.currency')}</span>
          }
          data-testid="auction-minIncrement"
        />
        {opening ? (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('fields.bidStepSuggestions')}
            data-testid="auction-step-chips"
          >
            {stepSuggestions(opening).map((value) => (
              <Chip
                key={value}
                size="sm"
                isActive={chosenStep === value}
                onClick={() => onStep(String(value))}
              >
                <span className="font-tabular">{number(value)}</span>
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <section className="grid gap-2" aria-labelledby="auction-extension">
        <h2 id="auction-extension" className={FIELD_LABEL}>
          {t('fields.extension')}
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label={t('fields.extensionMinutes')}
            inputMode="numeric"
            className="font-tabular"
            value={state.antiSnipingMinutes}
            onChange={(event) => set('antiSnipingMinutes', event.target.value)}
            aria-invalid={Boolean(fieldError('antiSnipingMinutes'))}
            trailing={
              <span className="pe-3 text-sm text-muted-foreground">{t('fields.minutesUnit')}</span>
            }
            data-testid="auction-antiSnipingMinutes"
          />
          <Input
            label={t('fields.extensionTimes')}
            inputMode="numeric"
            className="font-tabular"
            value={state.maxExtensions}
            onChange={(event) => set('maxExtensions', event.target.value)}
            aria-invalid={Boolean(fieldError('maxExtensions'))}
            trailing={
              <span className="pe-3 text-sm text-muted-foreground">{t('fields.timesUnit')}</span>
            }
            data-testid="auction-maxExtensions"
          />
        </div>
        {extensionError ? (
          <p role="alert" className="text-[12.5px] text-destructive">
            {extensionError}
          </p>
        ) : (
          <p
            className="text-[12.5px] leading-[1.6] text-muted-foreground"
            data-testid="auction-extension-help"
          >
            {t('fields.extensionRule', { minutes, times })}
          </p>
        )}
      </section>
    </>
  );
}
