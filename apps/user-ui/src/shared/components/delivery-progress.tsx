import { Check } from 'lucide-react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS, type OrderStatusStep } from '@biashara-mall/config';

export function DeliveryProgress({ status }: { status: OrderStatusStep }) {
  const currentIndex = ORDER_STATUS_STEPS.indexOf(status);

  return (
    <div className="flex w-full items-start">
      {ORDER_STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === ORDER_STATUS_STEPS.length - 1;
        return (
          <div key={step} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-label-sm font-medium ${
                  done
                    ? 'bg-primary text-on-primary'
                    : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant'
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={`w-20 text-center text-label-sm ${done ? 'text-on-surface' : 'text-on-surface-variant'}`}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div className={`mb-6 h-0.5 flex-1 ${i < currentIndex ? 'bg-primary' : 'bg-outline-variant'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
