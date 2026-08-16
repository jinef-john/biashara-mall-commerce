'use client';

import { useOrganization } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useApi } from '../../../lib/api';

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
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShopDetailsForm>();

  const onSubmit = async (data: ShopDetailsForm) => {
    setSubmitError(null);
    try {
      await api.post('/seller/api/shops', { name: organization?.name, ...data });
      router.push('/');
    } catch {
      setSubmitError('Could not save shop details. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-lg bg-surface px-md py-xl">
      <div className="w-full max-w-md">
        <div className="mb-lg text-center">
          <h1 className="text-headline-lg text-on-surface">
            Tell buyers about {organization?.name ?? 'your shop'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            This shows up on your public shop page.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-md"
        >
          <div>
            <label className="text-label-md text-on-surface-variant">
              Shop bio
            </label>
            <textarea
              {...register('bio', {
                required: 'A short bio helps buyers trust your shop',
                maxLength: {
                  value: 500,
                  message: 'Keep it under 100 words',
                },
              })}
              rows={3}
              className="mt-xs w-full rounded border border-outline-variant px-md py-sm text-body-md text-on-surface"
              placeholder="A one-line summary of what your shop sells"
            />
            {errors.bio && (
              <p className="text-body-sm text-error">{errors.bio.message}</p>
            )}
          </div>

          <div>
            <label className="text-label-md text-on-surface-variant">
              Address
            </label>
            <input
              {...register('address', { required: 'Address is required' })}
              className="mt-xs w-full rounded border border-outline-variant px-md py-sm text-body-md text-on-surface"
            />
            {errors.address && (
              <p className="text-body-sm text-error">
                {errors.address.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-label-md text-on-surface-variant">
              Opening hours
            </label>
            <input
              {...register('openingHours')}
              placeholder="e.g. Mon–Sat, 9am–6pm"
              className="mt-xs w-full rounded border border-outline-variant px-md py-sm text-body-md text-on-surface"
            />
          </div>

          <div>
            <label className="text-label-md text-on-surface-variant">
              Website
            </label>
            <input
              {...register('website')}
              placeholder="https://"
              className="mt-xs w-full rounded border border-outline-variant px-md py-sm text-body-md text-on-surface"
            />
          </div>

          <div>
            <label className="text-label-md text-on-surface-variant">
              Category
            </label>
            <select
              {...register('category', { required: 'Pick a category' })}
              className="mt-xs w-full rounded border border-outline-variant px-md py-sm text-body-md text-on-surface"
              defaultValue=""
            >
              <option value="" disabled>
                Select a category
              </option>
              {SHOP_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-body-sm text-error">
                {errors.category.message}
              </p>
            )}
          </div>

          {submitError && (
            <p className="text-body-sm text-error">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-sm rounded bg-primary px-md py-sm text-label-md text-on-primary hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Finish setup'}
          </button>
        </form>
      </div>
    </main>
  );
}
