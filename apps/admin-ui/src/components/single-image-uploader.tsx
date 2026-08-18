'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../lib/api';

export interface UploadedImage {
  fileId: string;
  fileUrl: string;
}

/** ImageKit accepts the data URI directly, so no need to strip the prefix. */
function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * A single-slot version of seller-ui's ImageUploader, generalised away from
 * react-hook-form's `Control<CreateProductForm>` to plain value/onChange.
 * Used for the site logo and hero banner, which aren't part of a product
 * form. Points at admin-service's own upload route (admin-gated, `/site-config`
 * ImageKit folder), not product-service's shop-scoped one.
 */
export function SingleImageUploader({
  value,
  onChange,
  label,
  aspectClassName = 'aspect-video',
}: {
  value: UploadedImage | null;
  onChange: (value: UploadedImage | null) => void;
  label: string;
  /** Matches the box to where the image actually displays, so cropping in
   * the preview matches cropping on the storefront (e.g. the hero banner's
   * real ~4:1 shape, vs. the default 16:9 used for the logo). */
  aspectClassName?: string;
}) {
  const api = useApi();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setPending(true);

    try {
      const base64 = await fileToBase64(file);
      const { data } = await api.post('/admin/api/upload-image', {
        file: base64,
        fileName: file.name,
      });
      onChange({ fileId: data.fileId, fileUrl: data.fileUrl });
    } catch (err) {
      console.error('Image upload failed', err);
      setError('The image failed to upload.');
    } finally {
      setPending(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    const removed = value;
    onChange(null);
    // A logo/banner hydrated from SiteConfig only ever carries a URL.
    // Its ImageKit fileId was never persisted, so there's nothing to clean up.
    if (!removed.fileId) return;
    try {
      await api.delete(`/admin/api/upload-image/${removed.fileId}`);
    } catch (err) {
      // The image is already gone from the form; a failed cleanup is not
      // worth blocking the admin over.
      console.error('Image delete failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          value
            ? `${aspectClassName} w-full max-w-sm overflow-hidden rounded border border-outline-variant`
            : `flex ${aspectClassName} w-full max-w-sm items-center justify-center overflow-hidden rounded border border-dashed border-outline bg-surface-container`
        }
      >
        {value ? (
          <div className="group relative h-full w-full bg-surface-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.fileUrl}
              alt=""
              className="h-full w-full object-contain"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={handleRemove}
              className="absolute top-1 right-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Remove ${label}`}
            >
              <X />
            </Button>
          </div>
        ) : pending ? (
          <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" />
        ) : (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-container-high">
            <ImagePlus className="h-6 w-6" />
            <span className="text-body-sm">Upload {label}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleSelect(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {error && <p className="text-body-sm text-error">{error}</p>}
    </div>
  );
}
