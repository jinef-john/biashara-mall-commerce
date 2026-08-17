'use client';

import { useOrganization } from '@clerk/nextjs';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApi } from '../../../lib/api';
import { Header } from '../../../components/header';
import { Field } from '../../../components/field';
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
  CardHeader,
  CardTitle,
  CardDescription,
} from '@biashara-mall/ui/components/ui/card';

interface ShopDetailsForm {
  bio: string;
  address: string;
  openingHours: string;
  website: string;
  category: string;
}

export default function ShopDetailsPage() {
  const { organization } = useOrganization();
  const api = useApi();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Same list the product form uses — one source of truth in SiteConfig.
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
    formState: { errors, isSubmitting },
  } = useForm<ShopDetailsForm>({
    defaultValues: {
      bio: '',
      address: '',
      openingHours: '',
      website: '',
      category: '',
    },
  });

  const onSubmit = async (data: ShopDetailsForm) => {
    setSubmitError(null);
    try {
      await api.post('/seller/api/shops', {
        name: organization?.name,
        ...data,
      });
      toast.success('Shop details saved — welcome aboard!');
      router.push('/');
    } catch (err) {
      console.error('Failed to save shop details', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not save shop details. Please try again.';
      setSubmitError(message);
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100svh-var(--header-height))] items-center justify-center bg-surface px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-headline-lg">
              Tell buyers about {organization?.name ?? 'your shop'}
            </CardTitle>
            <CardDescription>
              This shows up on your public shop page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <Field
                label="Shop bio"
                htmlFor="bio"
                required
                error={errors.bio?.message}
              >
                <Textarea
                  id="bio"
                  {...register('bio', {
                    required: 'A short bio helps buyers trust your shop',
                    maxLength: {
                      value: 500,
                      message: 'Keep it under 100 words',
                    },
                  })}
                  rows={3}
                  placeholder="A one-line summary of what your shop sells"
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

              <Field
                label="Category"
                htmlFor="category"
                required
                error={errors.category?.message}
              >
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Pick a category' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
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

              {submitError && (
                <p className="text-body-sm text-error">{submitError}</p>
              )}

              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? 'Saving…' : 'Finish setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
