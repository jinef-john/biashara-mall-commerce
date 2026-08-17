'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../lib/api';
import { ColorSelector } from '../../../components/create-product/color-selector';
import { SizeSelector } from '../../../components/create-product/size-selector';
import { CustomSpecifications } from '../../../components/create-product/custom-specifications';
import { CustomProperties } from '../../../components/create-product/custom-properties';
import { RichTextEditor } from '../../../components/create-product/rich-text-editor';
import { ImageUploader } from '../../../components/create-product/image-uploader';
import type { CreateProductForm } from '../../../components/create-product/types';
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

interface CategoriesResponse {
  categories: string[];
  subcategories: Record<string, string[]>;
}

export default function CreateProductPage() {
  const api = useApi();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    },
  });

  const selectedCategory = useWatch({ control, name: 'category' });
  const regularPrice = useWatch({ control, name: 'regularPrice' });
  const subcategories = categoryData?.subcategories?.[selectedCategory] ?? [];

  const onSubmit = async (data: CreateProductForm) => {
    setSubmitError(null);
    try {
      await api.post('/product/api/products', {
        ...data,
        tags: data.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        regularPrice: Number(data.regularPrice),
        salePrice: Number(data.salePrice),
        stock: Number(data.stock),
      });
      router.push('/dashboard/all-products');
    } catch (err) {
      console.error('Failed to create product', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not create the product. Please try again.';
      setSubmitError(message);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Create a product</h1>
        <p className="text-body-md text-on-surface-variant">
          Fields marked <span className="text-error">*</span> are required.
        </p>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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
              hint="Shown on the product card in search results."
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
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
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

              <Field label="Tags" htmlFor="tags" hint="Separate with commas.">
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder="cotton, handmade"
                />
              </Field>
            </div>

            <Field
              label="Video URL"
              htmlFor="videoUrl"
              hint="A YouTube embed link."
            >
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
                label="Regular price"
                htmlFor="regularPrice"
                required
                error={errors.regularPrice?.message}
              >
                <Input
                  id="regularPrice"
                  type="number"
                  step="0.01"
                  {...register('regularPrice', {
                    required: 'Required',
                    min: { value: 0, message: 'Must be positive' },
                  })}
                />
              </Field>

              <Field
                label="Sale price"
                htmlFor="salePrice"
                required
                error={errors.salePrice?.message}
              >
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  {...register('salePrice', {
                    required: 'Required',
                    min: { value: 0, message: 'Must be positive' },
                    validate: (value) =>
                      !regularPrice ||
                      Number(value) <= Number(regularPrice) ||
                      'Cannot exceed the regular price',
                  })}
                />
              </Field>

              <Field
                label="Stock"
                htmlFor="stock"
                required
                error={errors.stock?.message}
              >
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', {
                    required: 'Required',
                    min: { value: 0, message: 'Must be positive' },
                  })}
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

        {submitError && (
          <p className="text-body-sm text-error">{submitError}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
