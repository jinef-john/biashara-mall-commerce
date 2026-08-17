'use client';

import { ProductForm } from '../../../components/create-product/product-form';

export default function CreateProductPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Create a product</h1>
        <p className="text-body-md text-on-surface-variant">
          Fields marked <span className="text-error">*</span> are required.
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
