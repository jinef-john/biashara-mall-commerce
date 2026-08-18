import { Skeleton } from '@biashara-mall/ui/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
} from '@biashara-mall/ui/components/ui/card';

/**
 * Placeholder for a data table. `columns` are the real headers so the loading
 * state has the same shape as the loaded one and nothing shifts on arrival.
 */
export function TableSkeleton({
  columns,
  rows = 4,
  leadingAvatar = false,
}: {
  columns: string[];
  rows?: number;
  leadingAvatar?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row}>
              {columns.map((column, index) => (
                <TableCell key={column}>
                  {index === 0 && leadingAvatar ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 shrink-0 rounded" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function FieldSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className={lines > 1 ? 'h-20 w-full' : 'h-9 w-full'} />
    </div>
  );
}

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {Array.from({ length: fields }, (_, i) => (
          <FieldSkeleton key={i} lines={i === 0 ? 3 : 1} />
        ))}
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
}
