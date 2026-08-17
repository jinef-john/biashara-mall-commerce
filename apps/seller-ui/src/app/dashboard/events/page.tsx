'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../lib/api';
import { formatMoney } from '../../../lib/format';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';

interface EventProduct {
  id: string;
  title: string;
  salePrice: number;
  regularPrice: number;
  stock: number;
  startingDate: string;
  endingDate: string;
  images: { id: string; fileUrl: string }[];
}

function eventState(event: EventProduct) {
  const now = new Date();
  if (new Date(event.endingDate) < now) return 'ended';
  if (new Date(event.startingDate) > now) return 'upcoming';
  return 'live';
}

export default function EventsPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [toDelete, setToDelete] = useState<EventProduct | null>(null);

  const {
    data: events,
    isPending,
    isError,
    refetch,
  } = useQuery<EventProduct[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/products', {
        params: { kind: 'events' },
      });
      return data.products;
    },
  });

  const remove = useMutation({
    mutationFn: (event: EventProduct) =>
      api.delete(`/product/api/products/${event.id}`),
    onSuccess: (_data, event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setToDelete(null);
      toast.success(`“${event.title}” moved to deleted`, {
        description: 'It will be removed for good in 24 hours.',
      });
    },
    onError: () => toast.error('Could not delete the event'),
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">Events</h1>
          <p className="text-body-md text-on-surface-variant">
            Time-limited offers with a countdown on the storefront.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/create">
            <CalendarPlus />
            New event
          </Link>
        </Button>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load events. The product service may be offline.
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
        <p className="text-body-md text-on-surface-variant">Loading events…</p>
      ) : (events?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">No events yet.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/events/create">
              Create your first event
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events!.map((event) => {
                const state = eventState(event);
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {event.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.images[0].fileUrl}
                            alt=""
                            className="size-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded bg-surface-container" />
                        )}
                        <span className="text-body-md text-on-surface">
                          {event.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="text-on-surface">
                        {formatMoney(event.salePrice)}
                      </span>
                      {event.salePrice < event.regularPrice && (
                        <span className="ml-2 text-on-surface-variant line-through">
                          {formatMoney(event.regularPrice)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {new Date(event.startingDate).toLocaleDateString()} –{' '}
                      {new Date(event.endingDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          state === 'live'
                            ? 'default'
                            : state === 'upcoming'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {state}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          className="text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container"
                        >
                          <Link
                            href={`/dashboard/products/${event.id}/edit`}
                            aria-label={`Edit ${event.title}`}
                            title="Edit"
                          >
                            <Pencil />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${event.title}`}
                          title="Delete"
                          onClick={() => setToDelete(event)}
                          className="text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete “${toDelete?.title}”?`}
        description="The event moves to a deleted state and is removed for good after 24 hours. You can restore it from All products before then."
        confirmLabel="Delete event"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
