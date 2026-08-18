'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
import { useApi } from '../../lib/api';
import { ColorSelector } from './color-selector';
import { SizeSelector } from './size-selector';
import { CustomSpecifications } from './custom-specifications';
import { CustomProperties } from './custom-properties';
import { RichTextEditor } from './rich-text-editor';
import { ImageUploader } from './image-uploader';
import type { CreateProductForm } from './types';
import { Field } from '../field';
import { NumericInput } from '../numeric-input';
import {
  CURRENCY,
  MONEY_PATTERN,
  INTEGER_PATTERN,
  money,
} from '../../lib/format';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Textarea } from '@biashara-mall/ui/components/ui/textarea';
import { Calendar } from '@biashara-mall/ui/components/ui/calendar';
import { Toggle } from '@biashara-mall/ui/components/ui/toggle';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@biashara-mall/ui/components/ui/popover';
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

interface CategoriesResponse {
  categories: string[];
  subcategories: Record<string, string[]>;
}

interface DiscountCode {
  id: string;
  publicName: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountCode: string;
}

/** Local-date helpers: toISOString() would shift the day across timezones. */
function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromDateString(value: string) {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function DateField({
  value,
  onChange,
  placeholder,
  disabledBefore,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabledBefore?: Date;
}) {
  const selected = fromDateString(value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start font-normal"
        >
          <CalendarIcon className="size-4" />
          {selected ? selected.toLocaleDateString() : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => date && onChange(toDateString(date))}
          disabled={disabledBefore ? { before: disabledBefore } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ProductForm({
  mode,
  isEvent = false,
  productId,
  defaultValues,
}: {
  mode: 'create' | 'edit';
  isEvent?: boolean;
  productId?: string;
  defaultValues?: Partial<CreateProductForm>;
}) {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: categoryData,
    isPending: categoriesLoading,
    isError: categoriesFailed,
    refetch: refetchCategories,
  } = useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/get-categories');
      return data;
    },
  });

  const { data: shopCodes } = useQuery<DiscountCode[]>({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/discount-codes');
      return data.discountCodes;
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductForm>({
    defaultValues: {
      title: '',
      shortDescription: '',
      detailedDescription: '',
      category: '',
      subcategory: '',
      brand: '',
      videoUrl: '',
      tags: '',
      warranty: '',
      regularPrice: '',
      salePrice: '',
      stock: '',
      cashOnDelivery: 'yes',
      colors: [],
      sizes: [],
      images: [],
      customSpecifications: [],
      customProperties: [],
      discountCodes: [],
      startingDate: '',
      endingDate: '',
      ...defaultValues,
    },
  });

  const selectedCategory = useWatch({ control, name: 'category' });
  const regularPrice = useWatch({ control, name: 'regularPrice' });
  const startingDate = useWatch({ control, name: 'startingDate' });
  const subcategories = categoryData?.subcategories?.[selectedCategory] ?? [];

  const noun = isEvent ? 'event' : 'product';
  const listUrl = isEvent ? '/dashboard/events' : '/dashboard/all-products';

  const onSubmit = async (data: CreateProductForm) => {
    const payload = {
      ...data,
      tags: data.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      regularPrice: money(data.regularPrice).value,
      salePrice: money(data.salePrice).value,
      stock: Number(data.stock),
      startingDate: isEvent ? data.startingDate : null,
      endingDate: isEvent ? data.endingDate : null,
    };

    try {
      if (mode === 'edit') {
        await api.put(`/product/api/products/${productId}`, payload);
        toast.success(`Saved “${data.title}”`);
      } else {
        await api.post('/product/api/products', payload);
        toast.success(
          isEvent ? `Event “${data.title}” created` : `“${data.title}” created`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      router.push(listUrl);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? `Could not save the ${noun}. Please try again.`;
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {categoriesFailed && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load categories. The product service may be offline.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetchCategories()}
          >
            Retry
          </Button>
        </div>
      )}

      {isEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Offer window</CardTitle>
            <CardDescription>
              The event shows with a countdown until the end date.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Starts"
              required
              error={errors.startingDate?.message}
            >
              <Controller
                name="startingDate"
                control={control}
                rules={{ required: 'Pick a start date' }}
                render={({ field }) => (
                  <DateField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Start date"
                  />
                )}
              />
            </Field>
            <Field label="Ends" required error={errors.endingDate?.message}>
              <Controller
                name="endingDate"
                control={control}
                rules={{
                  required: 'Pick an end date',
                  validate: (value) =>
                    !startingDate ||
                    !value ||
                    value > startingDate ||
                    'Must end after it starts',
                }}
                render={({ field }) => (
                  <DateField
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="End date"
                    disabledBefore={fromDateString(startingDate)}
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Upload up to 8 photos. They go live as soon as you pick them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader control={control} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field
            label="Product title"
            htmlFor="title"
            required
            error={errors.title?.message}
          >
            <Input
              id="title"
              {...register('title', { required: 'A title is required' })}
              placeholder="e.g. Canvas Tote Bag"
            />
          </Field>

          <Field
            label="Short description"
            htmlFor="shortDescription"
            required
            error={errors.shortDescription?.message}
          >
            <Textarea
              id="shortDescription"
              rows={2}
              {...register('shortDescription', {
                required: 'A short description is required',
                maxLength: {
                  value: 300,
                  message: 'Keep this under 300 characters',
                },
              })}
              placeholder="One or two lines summarising the product"
            />
          </Field>

          <Field
            label="Detailed description"
            required
            error={errors.detailedDescription?.message}
          >
            <Controller
              name="detailedDescription"
              control={control}
              rules={{ required: 'A detailed description is required' }}
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
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
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue('subcategory', '');
                    }}
                    disabled={categoriesLoading || categoriesFailed}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue
                        placeholder={
                          categoriesFailed
                            ? 'Unavailable'
                            : categoriesLoading
                              ? 'Loading…'
                              : 'Select a category'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryData?.categories?.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field
              label="Subcategory"
              htmlFor="subcategory"
              required
              error={errors.subcategory?.message}
            >
              <Controller
                name="subcategory"
                control={control}
                rules={{ required: 'Pick a subcategory' }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="subcategory" className="w-full">
                      <SelectValue
                        placeholder={
                          selectedCategory
                            ? 'Select a subcategory'
                            : 'Pick a category first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Brand" htmlFor="brand">
              <Input id="brand" {...register('brand')} />
            </Field>

            <Field label="Tags" htmlFor="tags">
              <Input
                id="tags"
                {...register('tags')}
                placeholder="cotton, handmade"
              />
            </Field>
          </div>

          <Field label="Video URL" htmlFor="videoUrl">
            <Input
              id="videoUrl"
              {...register('videoUrl')}
              placeholder="https://"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; stock</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field
              label={`Regular price (${CURRENCY})`}
              htmlFor="regularPrice"
              required
              error={errors.regularPrice?.message}
            >
              <NumericInput
                id="regularPrice"
                variant="decimal"
                placeholder="450.00"
                control={control}
                name="regularPrice"
                rules={{
                  required: 'Required',
                  pattern: {
                    value: MONEY_PATTERN,
                    message: 'Enter an amount like 450 or 450.00',
                  },
                }}
              />
            </Field>

            <Field
              label={`Sale price (${CURRENCY})`}
              htmlFor="salePrice"
              required
              error={errors.salePrice?.message}
            >
              <NumericInput
                id="salePrice"
                variant="decimal"
                placeholder="419.00"
                control={control}
                name="salePrice"
                rules={{
                  required: 'Required',
                  pattern: {
                    value: MONEY_PATTERN,
                    message: 'Enter an amount like 419 or 419.00',
                  },
                  validate: (value) =>
                    !regularPrice ||
                    !MONEY_PATTERN.test(String(value)) ||
                    money(String(value)).value <=
                      money(String(regularPrice)).value ||
                    'Cannot exceed the regular price',
                }}
              />
            </Field>

            <Field
              label="Stock"
              htmlFor="stock"
              required
              error={errors.stock?.message}
            >
              <NumericInput
                id="stock"
                variant="integer"
                placeholder="35"
                control={control}
                name="stock"
                rules={{
                  required: 'Required',
                  pattern: {
                    value: INTEGER_PATTERN,
                    message: 'Whole number, e.g. 35',
                  },
                }}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Cash on delivery" htmlFor="cashOnDelivery">
              <Controller
                name="cashOnDelivery"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cashOnDelivery" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Accepted</SelectItem>
                      <SelectItem value="no">Not accepted</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Warranty" htmlFor="warranty">
              <Input
                id="warranty"
                {...register('warranty')}
                placeholder="e.g. 1 year"
              />
            </Field>
          </div>

          {(shopCodes?.length ?? 0) > 0 && (
            <Field
              label="Discount codes"
              hint="Buyers can apply the selected codes to this product at checkout."
            >
              <Controller
                name="discountCodes"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {shopCodes!.map((code) => (
                      <Toggle
                        key={code.id}
                        variant="outline"
                        pressed={field.value.includes(code.id)}
                        onPressedChange={(pressed) =>
                          field.onChange(
                            pressed
                              ? [...field.value, code.id]
                              : field.value.filter((id) => id !== code.id),
                          )
                        }
                      >
                        {code.publicName} ·{' '}
                        {code.discountType === 'percentage'
                          ? `${code.discountValue}%`
                          : `${CURRENCY} ${code.discountValue}`}
                      </Toggle>
                    ))}
                  </div>
                )}
              />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>
            Colors and sizes buyers can choose from.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field label="Colors">
            <ColorSelector control={control} />
          </Field>
          <Field label="Sizes">
            <SizeSelector control={control} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
          <CardDescription>
            Fixed specs, plus any custom options buyers pick from.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field label="Custom specifications">
            <CustomSpecifications control={control} />
          </Field>
          <Field label="Custom properties">
            <CustomProperties control={control} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving…'
            : mode === 'edit'
              ? 'Save changes'
              : `Create ${noun}`}
        </Button>
      </div>
    </form>
  );
}
