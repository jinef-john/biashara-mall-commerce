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

interface CategoriesResponse {
  categories: string[];
  subcategories: Record<string, string[]>;
}

export default function CreateProductPage() {
  const api = useApi();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categoryData, isLoading: categoriesLoading } =
    useQuery<CategoriesResponse>({
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
          Everything buyers see on the product page.
        </p>
      </div>

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
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">Product title</Label>
              <Input
                id="title"
                {...register('title', { required: 'A title is required' })}
                placeholder="e.g. Canvas Tote Bag"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-body-sm text-error">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="shortDescription">Short description</Label>
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
                placeholder="One or two lines shown on the product card"
                className="mt-1"
              />
              {errors.shortDescription && (
                <p className="text-body-sm text-error">
                  {errors.shortDescription.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="detailedDescription">Detailed description</Label>
              <Controller
                name="detailedDescription"
                control={control}
                rules={{ required: 'A detailed description is required' }}
                render={({ field }) => (
                  <div className="mt-1">
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                )}
              />
              {errors.detailedDescription && (
                <p className="text-body-sm text-error">
                  {errors.detailedDescription.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Pick a category' }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // The old subcategory belongs to the old category.
                        setValue('subcategory', '');
                      }}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger id="category" className="mt-1 w-full">
                        <SelectValue
                          placeholder={
                            categoriesLoading ? 'Loading…' : 'Select a category'
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
                {errors.category && (
                  <p className="text-body-sm text-error">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
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
                      <SelectTrigger id="subcategory" className="mt-1 w-full">
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
                {errors.subcategory && (
                  <p className="text-body-sm text-error">
                    {errors.subcategory.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...register('brand')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  {...register('tags')}
                  placeholder="Comma separated, e.g. cotton, handmade"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                {...register('videoUrl')}
                placeholder="YouTube embed link (optional)"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing &amp; stock</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="regularPrice">Regular price</Label>
                <Input
                  id="regularPrice"
                  type="number"
                  step="0.01"
                  {...register('regularPrice', {
                    required: 'Required',
                    min: { value: 0, message: 'Must be positive' },
                  })}
                  className="mt-1"
                />
                {errors.regularPrice && (
                  <p className="text-body-sm text-error">
                    {errors.regularPrice.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="salePrice">Sale price</Label>
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
                  className="mt-1"
                />
                {errors.salePrice && (
                  <p className="text-body-sm text-error">
                    {errors.salePrice.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock', {
                    required: 'Required',
                    min: { value: 0, message: 'Must be positive' },
                  })}
                  className="mt-1"
                />
                {errors.stock && (
                  <p className="text-body-sm text-error">
                    {errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cashOnDelivery">Cash on delivery</Label>
                <Controller
                  name="cashOnDelivery"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="cashOnDelivery" className="mt-1 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Accepted</SelectItem>
                        <SelectItem value="no">Not accepted</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="warranty">Warranty</Label>
                <Input
                  id="warranty"
                  {...register('warranty')}
                  placeholder="e.g. 1 year"
                  className="mt-1"
                />
              </div>
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
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label>Colors</Label>
              <div className="mt-2">
                <ColorSelector control={control} />
              </div>
            </div>
            <div>
              <Label>Sizes</Label>
              <div className="mt-2">
                <SizeSelector control={control} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>
              Fixed specs, plus any custom options buyers pick from.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label>Custom specifications</Label>
              <div className="mt-2">
                <CustomSpecifications control={control} />
              </div>
            </div>
            <div>
              <Label>Custom properties</Label>
              <div className="mt-2">
                <CustomProperties control={control} />
              </div>
            </div>
          </CardContent>
        </Card>

        {submitError && <p className="text-body-sm text-error">{submitError}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
