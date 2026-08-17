'use client';

import { ProductForm } from '../../../../components/create-product/product-form';

export default function CreateEventPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Create an event</h1>
        <p className="text-body-md text-on-surface-variant">
          A time-limited offer — buyers see it with a countdown.
        </p>
      </div>
      <ProductForm mode="create" isEvent />
    </div>
  );
}
