'use client';

import { useOrganization } from '@clerk/nextjs';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApi } from '../../../lib/api';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Textarea } from '@biashara-mall/ui/components/ui/textarea';
import { Label } from '@biashara-mall/ui/components/ui/label';
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

const SHOP_CATEGORIES = [
  'Fashion & Apparel',
  'Electronics',
  'Home & Living',
  'Beauty & Personal Care',
  'Food & Groceries',
  'Software and Technology Services',
  'Health & Wellness',
  'Other',
];

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
      router.push('/');
    } catch (err) {
      console.error('Failed to save shop details', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ?? 'Could not save shop details. Please try again.';
      setSubmitError(message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
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
            className="flex flex-col gap-4"
          >
            <div>
              <Label htmlFor="bio">Shop bio</Label>
              <Textarea
                id="bio"
                {...register('bio', {
                  required: 'A short bio helps buyers trust your shop',
                  maxLength: { value: 500, message: 'Keep it under 100 words' },
                })}
                rows={3}
                placeholder="A one-line summary of what your shop sells"
                className="mt-1"
              />
              {errors.bio && (
                <p className="text-body-sm text-error">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register('address', { required: 'Address is required' })}
                className="mt-1"
              />
              {errors.address && (
                <p className="text-body-sm text-error">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="openingHours">Opening hours</Label>
              <Input
                id="openingHours"
                {...register('openingHours')}
                placeholder="e.g. Mon–Sat, 9am–6pm"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register('website')}
                placeholder="https://"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Pick a category' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="category" className="mt-1 w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOP_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-body-sm text-error">
                  {errors.category.message}
                </p>
              )}
            </div>

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
  );
}
