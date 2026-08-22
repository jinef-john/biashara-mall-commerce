'use client';

import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { COUNTRIES } from '@biashara-mall/config';
import { useApi } from '../../lib/api';
import { Field } from './field';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Checkbox } from '@biashara-mall/ui/components/ui/checkbox';
import { Label } from '@biashara-mall/ui/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@biashara-mall/ui/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@biashara-mall/ui/components/ui/select';

interface AddressForm {
  label: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export function AddressFormDialog({
  open,
  onOpenChange,
  onSaved,
  forceDefault = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  /** Checkout only accepts the default address, so one opened from there must
   * become the default or the retry blocks on the same guard again. */
  forceDefault?: boolean;
}) {
  const api = useApi();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressForm>({
    defaultValues: {
      label: '',
      name: '',
      street: '',
      city: '',
      zip: '',
      country: '',
      isDefault: forceDefault,
    },
  });

  const create = useMutation({
    mutationFn: (data: AddressForm) => api.post('/user/api/addresses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address added');
      reset();
      onOpenChange(false);
      onSaved?.();
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Could not save the address';
      toast.error(message);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a shipping address</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => create.mutate(data))}
          className="flex flex-col gap-4"
        >
          <Field label="Label" htmlFor="label" required error={errors.label?.message}>
            <Input
              id="label"
              placeholder="Home, Work…"
              {...register('label', { required: 'Give this address a label' })}
            />
          </Field>

          <Field label="Recipient name" htmlFor="name" required error={errors.name?.message}>
            <Input id="name" {...register('name', { required: 'Required' })} />
          </Field>

          <Field label="Street address" htmlFor="street" required error={errors.street?.message}>
            <Input id="street" {...register('street', { required: 'Required' })} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City" htmlFor="city" required error={errors.city?.message}>
              <Input id="city" {...register('city', { required: 'Required' })} />
            </Field>
            <Field label="ZIP / postal code" htmlFor="zip" required error={errors.zip?.message}>
              <Input id="zip" {...register('zip', { required: 'Required' })} />
            </Field>
          </div>

          <Field label="Country" htmlFor="country" required error={errors.country?.message}>
            <Controller
              name="country"
              control={control}
              rules={{ required: 'Pick a country' }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {!forceDefault && (
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <Label className="flex items-center gap-2 font-normal">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <span className="text-body-sm text-on-surface">
                    Set as default address
                  </span>
                </Label>
              )}
            />
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? 'Saving…' : 'Save address'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
