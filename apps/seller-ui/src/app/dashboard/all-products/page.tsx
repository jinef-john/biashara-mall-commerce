'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackagePlus, RotateCcw, Trash2 } from 'lucide-react';
import { useApi } from '../../../lib/api';
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

  const {
    data: products,
    isPending,
    isError,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ['products', showDeleted],
    queryFn: async () => {
      const { data } = await api.get('/product/api/products', {
        params: showDeleted ? { includeDeleted: 'true' } : undefined,
      });
      return data.products;
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/product/api/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const restore = useMutation({
    mutationFn: (id: string) => api.post(`/product/api/products/${id}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
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
        <p className="text-body-md text-on-surface-variant">
          Loading products…
        </p>
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
                    <span className="text-on-surface">{product.salePrice}</span>
                    {product.salePrice < product.regularPrice && (
                      <span className="ml-2 text-on-surface-variant line-through">
                        {product.regularPrice}
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
                    {product.isDeleted ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Restore ${product.title}`}
                        disabled={restore.isPending}
                        onClick={() => restore.mutate(product.id)}
                      >
                        <RotateCcw />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${product.title}`}
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(product.id)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
