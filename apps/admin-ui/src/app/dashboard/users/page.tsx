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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@biashara-mall/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@biashara-mall/ui/components/ui/table';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin';
  deletedAt: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  pagination: { total: number; page: number; totalPages: number };
}

type RoleFilter = 'all' | 'user' | 'admin';
type PendingAction = { type: 'ban' | 'unban' | 'make-admin'; user: AdminUser };

export default function AdminUsersPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const { data, isPending, isError, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users', page, q, role],
    queryFn: async () => {
      const { data } = await api.get('/admin/api/get-all-users', {
        params: { page, ...(q ? { q } : {}), ...(role !== 'all' ? { role } : {}) },
      });
      return data;
    },
  });

  const users = data?.users ?? [];

  const updateStatus = useMutation({
    mutationFn: ({ user, banned }: { user: AdminUser; banned: boolean }) =>
      api.put(`/admin/api/update-user-status/${user.id}`, { banned }),
    onSuccess: (_res, { user, banned }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setPending(null);
      toast.success(banned ? `${user.email} banned` : `${user.email} unbanned`);
    },
    onError: () => {
      toast.error('Could not update this user');
      setPending(null);
    },
  });

  const makeAdmin = useMutation({
    mutationFn: (user: AdminUser) =>
      api.put('/admin/api/add-new-admin', { userId: user.id }),
    onSuccess: (_res, user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setPending(null);
      toast.success(`${user.email} is now an admin`);
    },
    onError: () => {
      toast.error('Could not promote this user');
      setPending(null);
    },
  });

  const confirmPending = () => {
    if (!pending) return;
    if (pending.type === 'make-admin') makeAdmin.mutate(pending.user);
    else updateStatus.mutate({ user: pending.user, banned: pending.type === 'ban' });
  };

  const dialogCopy: Record<PendingAction['type'], { title: string; description: string; confirmLabel: string; destructive: boolean }> = {
    ban: {
      title: 'Ban this user?',
      description: 'They will be signed out of every session and unable to use the platform until unbanned.',
      confirmLabel: 'Ban user',
      destructive: true,
    },
    unban: {
      title: 'Unban this user?',
      description: 'They will regain full access immediately.',
      confirmLabel: 'Unban user',
      destructive: false,
    },
    'make-admin': {
      title: 'Make this user an admin?',
      description: 'They will get full platform-admin access, including this dashboard.',
      confirmLabel: 'Make admin',
      destructive: false,
    },
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">Users</h1>
        <p className="text-body-md text-on-surface-variant">
          Every account registered on the platform.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(search.trim());
          }}
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
        <Select
          value={role}
          onValueChange={(v) => {
            setPage(1);
            setRole(v as RoleFilter);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load users. The admin service may be offline.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : isPending ? (
        <TableSkeleton columns={['User', 'Role', 'Status', 'Joined', '']} />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">
            {q || role !== 'all' ? 'No users match that filter.' : 'No users yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="w-24">Role</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-28">Joined</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const banned = Boolean(user.deletedAt);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-0">
                      <span className="truncate text-on-surface" title={user.email}>
                        {user.name ?? user.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'admin' && !banned && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPending({ type: 'make-admin', user })}
                          >
                            Make admin
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button
                            type="button"
                            variant={banned ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() =>
                              setPending({ type: banned ? 'unban' : 'ban', user })
                            }
                          >
                            {banned ? 'Unban' : 'Ban'}
                          </Button>
                        )}
                      </div>
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
        title={pending ? dialogCopy[pending.type].title : ''}
        description={pending ? dialogCopy[pending.type].description : ''}
        confirmLabel={pending ? dialogCopy[pending.type].confirmLabel : ''}
        destructive={pending ? dialogCopy[pending.type].destructive : false}
        pending={updateStatus.isPending || makeAdmin.isPending}
        onConfirm={confirmPending}
      />
    </div>
  );
}
