'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { TableSkeleton } from '../../../components/skeletons';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Input } from '@biashara-mall/ui/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';

interface ProductImage {
  id: string;
  fileUrl: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  salePrice: number;
  regularPrice: number;
  stock: number;
  status: string;
  isDeleted: boolean;
  images: ProductImage[];
}

export default function AllProductsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const {
    data: products,
    isPending,
    isError,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ['products', showDeleted],
    queryFn: async () => {
      const { data } = await api.get('/product/api/products', {
        params: {
          kind: 'products',
          ...(showDeleted ? { includeDeleted: 'true' } : {}),
        },
      });
      return data.products;
    },
  });

  const remove = useMutation({
    mutationFn: (product: Product) =>
      api.delete(`/product/api/products/${product.id}`),
    onSuccess: (_data, product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setToDelete(null);
      toast.success(`“${product.title}” moved to deleted`, {
        description: 'It will be removed for good in 24 hours.',
      });
    },
    onError: () => toast.error('Could not delete the product'),
  });

  const restore = useMutation({
    mutationFn: (product: Product) =>
      api.post(`/product/api/products/${product.id}/restore`),
    onSuccess: (_data, product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`“${product.title}” restored`);
    },
    onError: () => toast.error('Could not restore the product'),
  });

  const visible = (products ?? []).filter((p) =>
    p.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">All products</h1>
          <p className="text-body-md text-on-surface-variant">
            Everything listed by your shop.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/create-product">
            <PackagePlus />
            New product
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title"
          className="max-w-xs"
        />
        <Button
          type="button"
          variant={showDeleted ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowDeleted((v) => !v)}
        >
          {showDeleted ? 'Hide deleted' : 'Show deleted'}
        </Button>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load products. The product service may be offline.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton
          columns={['Product', 'Category', 'Price', 'Stock', 'Status', '']}
          leadingAvatar
        />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">
            {products?.length
              ? 'No products match that search.'
              : 'No products yet.'}
          </p>
          {!products?.length && (
            <Button asChild variant="outline">
              <Link href="/dashboard/create-product">
                Create your first product
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((product) => (
                <TableRow key={product.id} data-deleted={product.isDeleted}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.images[0].fileUrl}
                          alt=""
                          className="size-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="size-10 shrink-0 rounded bg-surface-container" />
                      )}
                      <span className="text-body-md text-on-surface">
                        {product.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {product.category} › {product.subcategory}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="text-on-surface">
                      {formatMoney(product.salePrice)}
                    </span>
                    {product.salePrice < product.regularPrice && (
                      <span className="ml-2 text-on-surface-variant line-through">
                        {formatMoney(product.regularPrice)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-on-surface">
                    {product.stock}
                  </TableCell>
                  <TableCell>
                    {product.isDeleted ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : (
                      <Badge variant="secondary">{product.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {product.isDeleted ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Restore ${product.title}`}
                          title="Restore"
                          disabled={restore.isPending}
                          onClick={() => restore.mutate(product)}
                          className="text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container"
                        >
                          <RotateCcw />
                        </Button>
                      ) : (
                        <>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container"
                          >
                            <Link
                              href={`/dashboard/products/${product.id}/edit`}
                              aria-label={`Edit ${product.title}`}
                              title="Edit"
                            >
                              <Pencil />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${product.title}`}
                            title="Delete"
                            onClick={() => setToDelete(product)}
                            className="text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete “${toDelete?.title}”?`}
        description="The product moves to a deleted state and is removed for good after 24 hours. You can restore it any time before then."
        confirmLabel="Delete product"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
