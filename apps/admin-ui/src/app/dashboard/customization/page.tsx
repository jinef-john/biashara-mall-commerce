'use client';

import { useState } from 'react';
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { useApi } from '../../../lib/api';
import { Field } from '../../../components/field';
import { FormSkeleton } from '../../../components/skeletons';
import {
  SingleImageUploader,
  type UploadedImage,
} from '../../../components/single-image-uploader';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@biashara-mall/ui/components/ui/card';

interface SiteConfig {
  categories: string[];
  subcategories: Record<string, string[]>;
  logoUrl: string | null;
  bannerUrl: string | null;
}

interface CustomizationForm {
  categories: string[];
  categoryRows: { category: string; subcategories: string[] }[];
  logo: UploadedImage | null;
  banner: UploadedImage | null;
}

function CategoryChips({ control }: { control: Control<CustomizationForm> }) {
  const [draft, setDraft] = useState('');

  return (
    <Controller
      name="categories"
      control={control}
      render={({ field }) => {
        const values: string[] = field.value ?? [];

        const add = () => {
          const v = draft.trim();
          if (!v || values.includes(v)) return;
          field.onChange([...values, v]);
          setDraft('');
        };

        return (
          <div className="flex flex-col gap-2">
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {values.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1">
                    {v}
                    <button
                      type="button"
                      aria-label={`Remove ${v}`}
                      onClick={() => field.onChange(values.filter((x) => x !== v))}
                      className="hover:text-error"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-1">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add();
                  }
                }}
                placeholder="Add a category"
                className="max-w-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={add}>
                Add
              </Button>
            </div>
          </div>
        );
      }}
    />
  );
}

function CategoryRow({
  control,
  index,
  onRemove,
}: {
  control: Control<CustomizationForm>;
  index: number;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState('');

  return (
    <div className="rounded-lg border border-outline-variant p-2">
      <div className="mb-1 flex items-center gap-2">
        <Controller
          name={`categoryRows.${index}.category`}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Category name (matching one above)"
              className="flex-1"
            />
          )}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove category group"
        >
          <X />
        </Button>
      </div>

      <Controller
        name={`categoryRows.${index}.subcategories`}
        control={control}
        render={({ field }) => {
          const values: string[] = field.value ?? [];

          const addValue = () => {
            const v = draft.trim();
            if (!v || values.includes(v)) return;
            field.onChange([...values, v]);
            setDraft('');
          };

          return (
            <>
              {values.length > 0 && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {values.map((v) => (
                    <Badge key={v} variant="secondary" className="gap-1">
                      {v}
                      <button
                        type="button"
                        aria-label={`Remove ${v}`}
                        onClick={() => field.onChange(values.filter((x) => x !== v))}
                        className="hover:text-error"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                  placeholder="Add subcategory"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addValue}>
                  Add
                </Button>
              </div>
            </>
          );
        }}
      />
    </div>
  );
}

export default function CustomizationPage() {
  const api = useApi();
  const queryClient = useQueryClient();

  const { data: siteConfig, isPending } = useQuery<SiteConfig | null>({
    queryKey: ['admin-customization'],
    queryFn: async () => {
      const { data } = await api.get('/admin/api/get-all-customization');
      return data.siteConfig;
    },
  });

  const { control, handleSubmit, formState: { isDirty } } = useForm<CustomizationForm>({
    defaultValues: { categories: [], categoryRows: [], logo: null, banner: null },
    // `values` (not reset() in an effect) so async defaults reach the
    // Controller-wrapped chip lists, field array, and image uploaders.
    values: siteConfig && {
      categories: siteConfig.categories,
      categoryRows: Object.entries(siteConfig.subcategories ?? {}).map(
        ([category, subcategories]) => ({ category, subcategories }),
      ),
      logo: siteConfig.logoUrl ? { fileId: '', fileUrl: siteConfig.logoUrl } : null,
      banner: siteConfig.bannerUrl ? { fileId: '', fileUrl: siteConfig.bannerUrl } : null,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'categoryRows' });

  const save = useMutation({
    mutationFn: (data: CustomizationForm) =>
      api.put('/admin/api/update-customization', {
        categories: data.categories,
        subcategories: Object.fromEntries(
          data.categoryRows
            .filter((r) => r.category.trim())
            .map((r) => [r.category.trim(), r.subcategories]),
        ),
        logoUrl: data.logo?.fileUrl ?? null,
        bannerUrl: data.banner?.fileUrl ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-customization'] });
      toast.success('Customization saved');
    },
    onError: () => toast.error('Could not save customization'),
  });

  if (isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <FormSkeleton fields={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Customization</h1>
        <p className="text-body-md text-on-surface-variant">
          Storefront branding and the category taxonomy sellers pick from.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) => save.mutate(data))}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <Field label="Logo">
              <Controller
                name="logo"
                control={control}
                render={({ field }) => (
                  <SingleImageUploader
                    label="logo"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field
              label="Hero banner"
              hint="Best fit: wide images around 4:1 (e.g. 1600×400). This preview matches how it's cropped on the storefront."
            >
              <Controller
                name="banner"
                control={control}
                render={({ field }) => (
                  <SingleImageUploader
                    label="banner"
                    value={field.value}
                    onChange={field.onChange}
                    aspectClassName="aspect-[4/1]"
                  />
                )}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field
              label="Categories"
              hint="Removing a category won't affect products or shops already using it. They just won't be offered it in dropdowns going forward."
            >
              <CategoryChips control={control} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subcategories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <CategoryRow
                key={field.id}
                control={control}
                index={index}
                onRemove={() => remove(index)}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => append({ category: '', subcategories: [] })}
            >
              <Plus />
              Add category group
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending || !isDirty}>
            {save.isPending ? 'Saving…' : 'Save customization'}
          </Button>
        </div>
      </form>
    </div>
  );
}
