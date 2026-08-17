export interface UploadedImage {
  fileId: string;
  fileUrl: string;
}

/**
 * Shared by the create-product page and every field component under it, so the
 * sub-components bind to real field names instead of `Control<any>`.
 */
export interface CreateProductForm {
  title: string;
  shortDescription: string;
  detailedDescription: string;
  category: string;
  subcategory: string;
  brand: string;
  videoUrl: string;
  tags: string;
  warranty: string;
  regularPrice: string;
  salePrice: string;
  stock: string;
  cashOnDelivery: string;
  colors: string[];
  sizes: string[];
  images: UploadedImage[];
  customSpecifications: { name: string; value: string }[];
  customProperties: { label: string; values: string[] }[];
  discountCodes: string[];
  /** yyyy-mm-dd; both set only for events */
  startingDate: string;
  endingDate: string;
}
