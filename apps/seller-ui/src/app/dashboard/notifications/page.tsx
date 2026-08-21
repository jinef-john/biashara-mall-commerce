'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useApi } from '../../../lib/api';
import { useNotifications, type NotificationItem } from '../../../lib/use-notifications';
import { ListSkeleton } from '../../../components/skeletons';
import { Button } from '@biashara-mall/ui/components/ui/button';

export default function NotificationsPage() {
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications, isPending, isError, refetch } = useNotifications();

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) =>
      api.post('/seller/api/seller-notifications/mark-notification-as-read', {
        notificationId,
      }),
    onSuccess: (_res, notificationId) => {
      queryClient.setQueryData<NotificationItem[]>(
        ['seller-notifications'],
        (current) =>
          current?.map((n) =>
            n.id === notificationId ? { ...n, status: 'read' } : n,
          ),
      );
    },
  });

  function handleClick(notification: NotificationItem) {
    if (notification.status === 'unread') markAsRead.mutate(notification.id);
    if (notification.redirectLink) router.push(notification.redirectLink);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Notifications</h1>
        <p className="text-body-md text-on-surface-variant">
          Updates about your orders and shop activity.
        </p>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load notifications.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <ListSkeleton />
      ) : (notifications?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <Bell className="size-8 text-on-surface-variant" />
          <p className="text-body-lg text-on-surface">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications!.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleClick(notification)}
              className={
                notification.status === 'unread'
                  ? 'flex items-start gap-3 rounded-xl border border-outline-variant bg-primary-container/40 px-4 py-3 text-left transition-colors hover:bg-primary-container/60'
                  : 'flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left transition-colors hover:bg-surface-container-low'
              }
            >
              {notification.status === 'unread' && (
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              )}
              <div
                className={
                  notification.status === 'unread'
                    ? 'flex-1'
                    : 'flex-1 pl-5'
                }
              >
                <p className="text-body-md font-medium text-on-surface">
                  {notification.title}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {notification.message}
                </p>
              </div>
              <span className="shrink-0 text-body-sm text-on-surface-variant">
                {new Date(notification.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
