'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../lib/api';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import { AddressFormDialog } from './address-form-dialog';
import { ConfirmDialog } from './confirm-dialog';

interface Address {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

function AddressCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-outline-variant p-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-56" />
    </div>
  );
}

export function AddressSection() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Address | null>(null);

  const { data, isPending } = useQuery<{ addresses: Address[] }>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await api.get('/user/api/addresses');
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: (address: Address) =>
      api.delete(`/user/api/addresses/${address.id}`),
    onSuccess: (_data, address) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setToDelete(null);
      toast.success(`“${address.label}” removed`);
    },
    onError: () => toast.error('Could not remove the address'),
  });

  const addresses = data?.addresses ?? [];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-sm text-on-surface">
            Shipping addresses
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Used at checkout to deliver your orders.
          </p>
        </div>
        <Button type="button" onClick={() => setFormOpen(true)}>
          <Plus />
          Add address
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AddressCardSkeleton />
          <AddressCardSkeleton />
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline px-6 py-12 text-center">
          <MapPin className="size-8 text-on-surface-variant" />
          <p className="text-body-md text-on-surface">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex flex-col gap-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-md font-medium text-on-surface">
                  {address.label}
                </span>
                {address.isDefault && <Badge variant="secondary">Default</Badge>}
              </div>
              <span className="text-body-sm text-on-surface-variant">
                {address.name}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                {address.street}, {address.city} {address.zip}, {address.country}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-fit text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                onClick={() => setToDelete(address)}
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddressFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Remove “${toDelete?.label}”?`}
        description="This address will no longer be available at checkout."
        confirmLabel="Remove address"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </section>
  );
}
