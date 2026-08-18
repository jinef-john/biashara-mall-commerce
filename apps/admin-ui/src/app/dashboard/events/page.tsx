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

interface EventProduct {
  id: string;
  title: string;
  salePrice: number;
  regularPrice: number;
  startingDate: string;
  endingDate: string;
  images: { id: string; fileUrl: string }[];
  shop: { id: string; name: string };
}

interface EventsResponse {
  products: EventProduct[];
  pagination: { total: number; page: number; totalPages: number };
}

type EventState = 'live' | 'upcoming' | 'ended';

function eventState(event: EventProduct): EventState {
  const now = new Date();
  if (new Date(event.endingDate) < now) return 'ended';
  if (new Date(event.startingDate) > now) return 'upcoming';
  return 'live';
}

/** "2d 4h" / "5h 12m" / "8m": coarse enough that it doesn't need a ticker. */
function untilLabel(target: string) {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return null;
  const mins = Math.floor(ms / 60_000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
}

const STATE_STYLES: Record<EventState, string> = {
  live: 'border-transparent bg-secondary-container text-on-secondary-container',
  upcoming: 'border-transparent bg-primary-fixed text-on-primary-fixed-variant',
  ended: 'border-outline-variant bg-transparent text-on-surface-variant',
};

function StatusCell({ event }: { event: EventProduct }) {
  const state = eventState(event);
  const until =
    state === 'live'
      ? untilLabel(event.endingDate)
      : state === 'upcoming'
        ? untilLabel(event.startingDate)
        : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="outline" className={`gap-1.5 ${STATE_STYLES[state]}`}>
        {state === 'live' && (
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-secondary" />
          </span>
        )}
        {state === 'live' ? 'Live' : state === 'upcoming' ? 'Upcoming' : 'Ended'}
      </Badge>
      {until && (
        <span className="text-body-sm text-on-surface-variant">
          {state === 'live' ? `ends in ${until}` : `starts in ${until}`}
        </span>
      )}
    </div>
  );
}

export default function AdminEventsPage() {
  const api = useApi();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useQuery<EventsResponse>({
    queryKey: ['admin-events', page, q],
    queryFn: async () => {
      const { data } = await api.get('/admin/api/get-all-events', {
        params: { page, ...(q ? { q } : {}) },
      });
      return data;
    },
  });

  const events = data?.products ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Events</h1>
        <p className="text-body-md text-on-surface-variant">
          Time-limited offers running across the platform.
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
            Could not load events. The admin service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton columns={['Event', 'Shop', 'Price', 'Runs', 'Status']} leadingAvatar />
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">
            {q ? 'No events match that search.' : 'No events yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="w-36">Shop</TableHead>
                <TableHead className="w-28 text-right">Price</TableHead>
                <TableHead className="w-44">Runs</TableHead>
                <TableHead className="w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const isEnded = eventState(event) === 'ended';
                return (
                  <TableRow key={event.id} className={isEnded ? 'opacity-60' : undefined}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
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
                        <span
                          className="truncate text-body-md text-on-surface"
                          title={event.title}
                        >
                          {event.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="truncate text-on-surface-variant"
                      title={event.shop.name}
                    >
                      {event.shop.name}
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
                      <StatusCell event={event} />
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
    </div>
  );
}
