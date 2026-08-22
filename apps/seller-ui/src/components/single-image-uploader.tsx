'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { useApi } from '../lib/api';

export interface UploadedImage {
  fileId: string;
  fileUrl: string;
}

// ImageKit accepts the data URI directly, so the prefix stays on.
function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function SingleImageUploader({
  value,
  onChange,
  label,
  aspectClassName = 'aspect-video',
  className,
}: {
  value: UploadedImage | null;
  onChange: (value: UploadedImage | null) => void;
  label: string;
  /** Match the box to where the image displays, so previews crop the same. */
  aspectClassName?: string;
  className?: string;
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
      const { data } = await api.post('/seller/api/shops/branding-image', {
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
    if (!removed.fileId) return;
    try {
      await api.delete(`/seller/api/shops/branding-image/${removed.fileId}`);
    } catch (err) {
      console.error('Image delete failed', err);
    }
  };

  return (
    <div className={className ?? 'flex flex-col gap-2'}>
      <p className="text-label-lg text-on-surface">{label}</p>
      <div
        className={
          value
            ? `${aspectClassName} w-full overflow-hidden rounded-lg border border-outline-variant`
            : `flex ${aspectClassName} w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-outline bg-surface-container`
        }
      >
        {value ? (
          <div className="group relative size-full bg-surface-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.fileUrl} alt="" className="size-full object-cover" />
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
          <Loader2 className="size-6 animate-spin text-on-surface-variant" />
        ) : (
          <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 text-on-surface-variant hover:bg-surface-container-high">
            <ImagePlus className="size-6" />
            <span className="text-body-sm">Upload</span>
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
