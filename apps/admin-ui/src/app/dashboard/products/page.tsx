'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { TableSkeleton } from '../../../components/skeletons';
import { Pagination } from '../../../components/pagination';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Input } from '@biashara-mall/ui/components/ui/input';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';

interface Product {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  salePrice: number;
  regularPrice: number;
  stock: number;
  status: string;
  isDeleted: boolean;
  images: { id: string; fileUrl: string }[];
  shop: { id: string; name: string };
}

interface ProductsResponse {
  products: Product[];
  pagination: { total: number; page: number; totalPages: number };
}

export default function AdminProductsPage() {
  const api = useApi();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useQuery<ProductsResponse>({
    queryKey: ['admin-products', page, q],
    queryFn: async () => {
      const { data } = await api.get('/admin/api/get-all-products', {
        params: { page, ...(q ? { q } : {}) },
      });
      return data;
    },
  });

  const products = data?.products ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Products</h1>
        <p className="text-body-md text-on-surface-variant">
          Every product listed across the platform.
        </p>
      </div>

      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(search.trim());
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load products. The admin service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton
          columns={['Product', 'Shop', 'Category', 'Price', 'Stock', 'Status']}
          leadingAvatar
        />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">
            {q ? 'No products match that search.' : 'No products yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-36">Shop</TableHead>
                <TableHead className="w-40">Category</TableHead>
                <TableHead className="w-28 text-right">Price</TableHead>
                <TableHead className="w-16 text-right">Stock</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
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
                      <span
                        className="truncate text-body-md text-on-surface"
                        title={product.title}
                      >
                        {product.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="truncate text-on-surface-variant"
                    title={product.shop.name}
                  >
                    {product.shop.name}
                  </TableCell>
                  <TableCell
                    className="truncate text-on-surface-variant"
                    title={`${product.category} › ${product.subcategory}`}
                  >
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
