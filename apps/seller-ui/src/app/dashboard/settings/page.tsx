'use client';

import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApi } from '../../../lib/api';
import { COUNTRIES } from '@biashara-mall/config';
import { Field } from '../../../components/field';
import { FormSkeleton } from '../../../components/skeletons';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Textarea } from '@biashara-mall/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@biashara-mall/ui/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@biashara-mall/ui/components/ui/card';

interface Shop {
  name: string;
  bio: string | null;
  address: string | null;
  country: string | null;
  openingHours: string | null;
  website: string | null;
  category: string | null;
  socialLinks: { instagram?: string; facebook?: string; x?: string } | null;
}

interface SettingsForm {
  bio: string;
  address: string;
  country: string;
  openingHours: string;
  website: string;
  category: string;
  instagram: string;
  facebook: string;
  x: string;
}

export default function SettingsPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const { data: shop, isPending } = useQuery<Shop>({
    queryKey: ['shop'],
    queryFn: async () => {
      const { data } = await api.get('/seller/api/shops/me');
      return data.shop;
    },
  });

  const { data: categoryData } = useQuery<{ categories: string[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/get-categories');
      return data;
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    defaultValues: {
      bio: '',
      address: '',
      country: '',
      openingHours: '',
      website: '',
      category: '',
      instagram: '',
      facebook: '',
      x: '',
    },
    // `values` (not a reset() in an effect) is what syncs asynchronously loaded
    // defaults: a reset() racing the first mount never reaches Controller-wrapped
    // fields, which is why the Selects came back blank while the inputs didn't.
    values: shop && {
      bio: shop.bio ?? '',
      address: shop.address ?? '',
      country: shop.country ?? '',
      openingHours: shop.openingHours ?? '',
      website: shop.website ?? '',
      category: shop.category ?? '',
      instagram: shop.socialLinks?.instagram ?? '',
      facebook: shop.socialLinks?.facebook ?? '',
      x: shop.socialLinks?.x ?? '',
    },
  });

  const save = useMutation({
    mutationFn: ({ instagram, facebook, x, ...rest }: SettingsForm) =>
      api.patch('/seller/api/shops', {
        ...rest,
        socialLinks: { instagram, facebook, x },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      toast.success('Shop settings saved');
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not save settings';
      toast.error(message);
    },
  });

  if (isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <FormSkeleton fields={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Shop settings</h1>
        <p className="text-body-md text-on-surface-variant">
          {shop?.name}: what buyers see on your public page.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) => save.mutate(data))}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field
              label="Shop bio"
              htmlFor="bio"
              required
              error={errors.bio?.message}
            >
              <Textarea
                id="bio"
                rows={3}
                {...register('bio', {
                  required: 'A short bio helps buyers trust your shop',
                  maxLength: { value: 500, message: 'Keep it under 100 words' },
                })}
              />
            </Field>

            <Field
              label="Address"
              htmlFor="address"
              required
              error={errors.address?.message}
            >
              <Input
                id="address"
                {...register('address', { required: 'Address is required' })}
              />
            </Field>

            <Field
              label="Country"
              htmlFor="country"
              required
              error={errors.country?.message}
            >
              <Controller
                name="country"
                control={control}
                rules={{ required: 'Buyers filter shops by country' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Opening hours" htmlFor="openingHours">
                <Input
                  id="openingHours"
                  {...register('openingHours')}
                  placeholder="e.g. Mon–Sat, 9am–6pm"
                />
              </Field>

              <Field label="Website" htmlFor="website">
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://"
                />
              </Field>
            </div>

            <Field label="Category" htmlFor="category">
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categoryData?.categories ?? []).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social links</CardTitle>
            <CardDescription>Shown on your shop page.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Field label="Instagram" htmlFor="instagram">
              <Input
                id="instagram"
                {...register('instagram')}
                placeholder="https://instagram.com/yourshop"
              />
            </Field>
            <Field label="Facebook" htmlFor="facebook">
              <Input
                id="facebook"
                {...register('facebook')}
                placeholder="https://facebook.com/yourshop"
              />
            </Field>
            <Field label="X" htmlFor="x">
              <Input
                id="x"
                {...register('x')}
                placeholder="https://x.com/yourshop"
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending || !isDirty}>
            {save.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
