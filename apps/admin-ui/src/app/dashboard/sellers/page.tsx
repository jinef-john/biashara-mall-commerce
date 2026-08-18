'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApi } from '../../../lib/api';
import { TableSkeleton } from '../../../components/skeletons';
import { ConfirmDialog } from '../../../components/confirm-dialog';
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

interface AdminShop {
  id: string;
  name: string;
  category: string | null;
  country: string | null;
  status: 'active' | 'banned';
  createdAt: string;
  _count: { products: number };
}

interface SellersResponse {
  shops: AdminShop[];
  pagination: { total: number; page: number; totalPages: number };
}

export default function AdminSellersPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<AdminShop | null>(null);

  const { data, isPending, isError, refetch } = useQuery<SellersResponse>({
    queryKey: ['admin-sellers', page, q],
    queryFn: async () => {
      const { data } = await api.get('/admin/api/get-all-sellers', {
        params: { page, ...(q ? { q } : {}) },
      });
      return data;
    },
  });

  const shops = data?.shops ?? [];

  const updateStatus = useMutation({
    mutationFn: ({ shop, banned }: { shop: AdminShop; banned: boolean }) =>
      api.put(`/admin/api/update-seller-status/${shop.id}`, { banned }),
    onSuccess: (_res, { shop, banned }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      setPending(null);
      toast.success(banned ? `${shop.name} banned` : `${shop.name} unbanned`);
    },
    onError: () => {
      toast.error('Could not update this shop');
      setPending(null);
    },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Sellers</h1>
        <p className="text-body-md text-on-surface-variant">
          Every shop trading on the platform.
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
          placeholder="Search by shop name"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load sellers. The admin service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton columns={['Shop', 'Category', 'Country', 'Products', 'Status', '']} />
      ) : shops.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">
            {q ? 'No shops match that search.' : 'No shops yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-32">Country</TableHead>
                <TableHead className="w-20 text-right">Products</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => {
                const banned = shop.status === 'banned';
                return (
                  <TableRow key={shop.id}>
                    <TableCell
                      className="truncate text-on-surface"
                      title={shop.name}
                    >
                      {shop.name}
                    </TableCell>
                    <TableCell className="truncate text-on-surface-variant">
                      {shop.category ?? 'N/A'}
                    </TableCell>
                    <TableCell className="truncate text-on-surface-variant">
                      {shop.country ?? 'N/A'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-on-surface">
                      {shop._count.products}
                    </TableCell>
                    <TableCell>
                      {banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant={banned ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setPending(shop)}
                      >
                        {banned ? 'Unban' : 'Ban'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.status === 'banned' ? `Unban "${pending.name}"?` : `Ban "${pending?.name}"?`}
        description={
          pending?.status === 'banned'
            ? 'Its storefront, products, and shop page become visible again immediately.'
            : "Its storefront, products, and shop page disappear from the platform immediately. The seller's own dashboard becomes inaccessible until unbanned."
        }
        confirmLabel={pending?.status === 'banned' ? 'Unban shop' : 'Ban shop'}
        destructive={pending?.status !== 'banned'}
        pending={updateStatus.isPending}
        onConfirm={() =>
          pending && updateStatus.mutate({ shop: pending, banned: pending.status !== 'banned' })
        }
      />
    </div>
  );
}
