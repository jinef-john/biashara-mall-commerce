'use client';

import { useState } from 'react';
import { useController, type Control } from 'react-hook-form';
import type { CreateProductForm, UploadedImage } from './types';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../../lib/api';

const MAX_IMAGES = 8;

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
 * Uploads each image to ImageKit as soon as it is picked, so the form only
 * ever carries {fileId, fileUrl} pairs. Removing a slot deletes the file
 * again, otherwise abandoned uploads pile up for products never created.
 */
export function ImageUploader({
  control,
}: {
  control: Control<CreateProductForm>;
}) {
  const api = useApi();
  const { field } = useController({
    name: 'images',
    control,
    defaultValue: [],
  });

  const images: UploadedImage[] = field.value ?? [];
  const [pendingSlots, setPendingSlots] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const openSlots = MAX_IMAGES - images.length - pendingSlots;

  const handleSelect = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const selected = Array.from(files).slice(0, openSlots);
    setPendingSlots((n) => n + selected.length);

    // Uploads resolve one at a time, so track the growing list locally rather
    // than reading a `field.value` that is stale for the rest of the loop.
    let current = images;

    for (const file of selected) {
      try {
        const base64 = await fileToBase64(file);
        const { data } = await api.post('/product/api/products/images', {
          file: base64,
          fileName: file.name,
        });
        current = [...current, { fileId: data.fileId, fileUrl: data.fileUrl }];
        field.onChange(current);
      } catch (err) {
        console.error('Image upload failed', err);
        setError('One or more images failed to upload.');
      } finally {
        setPendingSlots((n) => n - 1);
      }
    }
  };

  const handleRemove = async (image: UploadedImage) => {
    field.onChange(images.filter((i) => i.fileId !== image.fileId));
    try {
      await api.delete(`/product/api/products/images/${image.fileId}`);
    } catch (err) {
      // The image is already gone from the form; a failed cleanup is not
      // worth blocking the seller over.
      console.error('Image delete failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <div
            key={image.fileId}
            className="group relative aspect-square overflow-hidden rounded border border-outline-variant"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.fileUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => handleRemove(image)}
              className="absolute top-1 right-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Remove image"
            >
              <X />
            </Button>
          </div>
        ))}

        {Array.from({ length: pendingSlots }).map((_, i) => (
          <div
            key={`pending-${i}`}
            className="flex aspect-square items-center justify-center rounded border border-outline-variant bg-surface-container"
          >
            <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant" />
          </div>
        ))}

        {openSlots > 0 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-outline text-on-surface-variant hover:bg-surface-container">
            <ImagePlus className="h-6 w-6" />
            <span className="text-body-sm">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleSelect(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      <p className="text-body-sm text-on-surface-variant">
        {images.length} of {MAX_IMAGES} images. The first one is used as the
        product thumbnail.
      </p>
      {error && <p className="text-body-sm text-error">{error}</p>}
    </div>
  );
}
