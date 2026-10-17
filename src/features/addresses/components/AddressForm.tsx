'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Input } from '@shared/components/ui';
import { getErrorCode } from '@shared/lib';
import { addressFormSchema } from '../schemas/addresses.schema';
import { useCreateAddress } from '../hooks/useCreateAddress';
import { useUpdateAddress } from '../hooks/useUpdateAddress';
import { useAddressesTranslation } from '../hooks/useAddressesTranslation';
import type { Address, AddressFormValues } from '../types/addresses.types';

export interface AddressFormProps {
  address?: Address;
  onDone: () => void;
}

/** Add or edit an address (design `.form`): label, city and area side by side, street, details. */
export function AddressForm({ address, onDone }: AddressFormProps) {
  const { t } = useAddressesTranslation();
  const { t: tCommon } = useTranslation('common');
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: address
      ? {
          label: address.label,
          city: address.city,
          area: address.area ?? undefined,
          street: address.street ?? undefined,
          details: address.details ?? undefined,
          contactPhone: address.contactPhone ?? undefined,
          isDefault: address.isDefault,
        }
      : undefined,
  });

  const mutation = address ? updateAddress : createAddress;
  const errorCode = getErrorCode(mutation.error);
  const fieldError = (message?: string) => (message ? t(message) : undefined);

  const onSubmit = handleSubmit((values) => {
    if (address) updateAddress.mutate({ id: address.id, values }, { onSuccess: onDone });
    else createAddress.mutate(values, { onSuccess: onDone });
  });
  const cancel = () => {
    reset();
    if (address) onDone();
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <Input
        label={t('fields.label')}
        placeholder={t('placeholders.label')}
        error={fieldError(errors.label?.message)}
        {...register('label')}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t('fields.city')}
          autoComplete="address-level2"
          error={fieldError(errors.city?.message)}
          {...register('city')}
        />
        <Input label={t('fields.area')} autoComplete="address-level3" {...register('area')} />
      </div>
      <Input
        label={t('fields.street')}
        placeholder={t('placeholders.street')}
        autoComplete="address-line1"
        {...register('street')}
      />
      <Input
        label={t('fields.details')}
        placeholder={t('placeholders.details')}
        {...register('details')}
      />
      <Input
        label={t('fields.contactPhone')}
        type="tel"
        isLatin
        placeholder={t('placeholders.contactPhone')}
        {...register('contactPhone')}
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground">
        <input type="checkbox" className="peer sr-only" {...register('isDefault')} />
        <span
          aria-hidden
          className="grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong text-transparent peer-checked:border-transparent peer-checked:bg-grad peer-checked:text-gold-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold"
        >
          <Icon name="check" size={14} />
        </span>
        {t('fields.isDefault')}
      </label>
      {errorCode ? (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${errorCode}`, { defaultValue: tCommon('errors.generic') })}
        </p>
      ) : null}
      <div className="flex gap-2.5">
        <Button type="submit" className="min-w-0 flex-1" isLoading={mutation.isPending}>
          {t(address ? 'form.save' : 'form.add')}
        </Button>
        <Button variant="soft" onClick={cancel}>
          {t('form.cancel')}
        </Button>
      </div>
    </form>
  );
}
