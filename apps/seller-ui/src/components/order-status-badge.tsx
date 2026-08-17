import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { ORDER_STATUS_LABELS, type OrderStatusStep } from '@biashara-mall/config';

const STATUS_STYLES: Record<OrderStatusStep, string> = {
  ordered: 'border-outline-variant bg-transparent text-on-surface-variant',
  packed: 'border-transparent bg-primary-fixed text-on-primary-fixed-variant',
  shipped: 'border-transparent bg-primary-fixed text-on-primary-fixed-variant',
  out_for_delivery: 'border-transparent bg-primary-fixed text-on-primary-fixed-variant',
  delivered: 'border-transparent bg-secondary-container text-on-secondary-container',
};

export function OrderStatusBadge({ status }: { status: OrderStatusStep }) {
  return (
    <Badge variant="outline" className={`gap-1.5 ${STATUS_STYLES[status]}`}>
      {status === 'out_for_delivery' && (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
      )}
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
