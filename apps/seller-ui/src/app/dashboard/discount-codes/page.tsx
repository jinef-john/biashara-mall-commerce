'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { TicketPercent, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '../../../lib/api';
import { CURRENCY } from '../../../lib/format';
import { Field } from '../../../components/field';
import { NumericInput } from '../../../components/numeric-input';
import { ConfirmDialog } from '../../../components/confirm-dialog';
import { TableSkeleton } from '../../../components/skeletons';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Input } from '@biashara-mall/ui/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@biashara-mall/ui/components/ui/dialog';
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

const MAX_CODES = 8;

interface DiscountCode {
  id: string;
  publicName: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  discountCode: string;
}

interface DiscountForm {
  publicName: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  discountCode: string;
}

export default function DiscountCodesPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DiscountCode | null>(null);

  const {
    data: codes,
    isPending,
    isError,
    refetch,
  } = useQuery<DiscountCode[]>({
    queryKey: ['discount-codes'],
    queryFn: async () => {
      const { data } = await api.get('/product/api/discount-codes');
      return data.discountCodes;
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountForm>({
    defaultValues: {
      publicName: '',
      discountType: 'percentage',
      discountValue: '',
      discountCode: '',
    },
  });

  const create = useMutation({
    mutationFn: (data: DiscountForm) =>
      api.post('/product/api/discount-codes', {
        ...data,
        discountValue: Number(data.discountValue),
      }),
    onSuccess: (_res, data) => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      setCreateOpen(false);
      reset();
      toast.success(`Discount code “${data.discountCode}” created`);
    },
    onError: (err) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Could not create the discount code';
      toast.error(message);
    },
  });

  const remove = useMutation({
    mutationFn: (code: DiscountCode) =>
      api.delete(`/product/api/discount-codes/${code.id}`),
    onSuccess: (_res, code) => {
      queryClient.invalidateQueries({ queryKey: ['discount-codes'] });
      setToDelete(null);
      toast.success(`Discount code “${code.discountCode}” deleted`);
    },
    onError: () => toast.error('Could not delete the discount code'),
  });

  const atLimit = (codes?.length ?? 0) >= MAX_CODES;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">Discount codes</h1>
          <p className="text-body-md text-on-surface-variant">
            Up to {MAX_CODES} codes buyers can apply at checkout.
          </p>
        </div>
        <Button
          type="button"
          disabled={atLimit}
          title={atLimit ? `Limit of ${MAX_CODES} codes reached` : undefined}
          onClick={() => setCreateOpen(true)}
        >
          <TicketPercent />
          New code
        </Button>
      </div>

      {isError ? (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-error bg-error-container px-4 py-3">
          <p className="text-body-sm text-on-error-container">
            Could not load discount codes.
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
        <TableSkeleton columns={['Name', 'Code', 'Discount', '']} rows={3} />
      ) : (codes?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline px-6 py-16 text-center">
          <p className="text-body-lg text-on-surface">No discount codes yet.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCreateOpen(true)}
          >
            Create your first code
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes!.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="text-on-surface">
                    {code.publicName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {code.discountCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-on-surface-variant">
                    {code.discountType === 'percentage'
                      ? `${code.discountValue}% off`
                      : `${CURRENCY} ${code.discountValue} off`}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${code.discountCode}`}
                      title="Delete"
                      onClick={() => setToDelete(code)}
                      className="text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New discount code</DialogTitle>
            <DialogDescription>
              Attach it to products from the product form afterwards.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => create.mutate(data))}
            className="flex flex-col gap-5"
          >
            <Field
              label="Public name"
              htmlFor="publicName"
              required
              error={errors.publicName?.message}
              hint="Shown to buyers, e.g. “Launch week”"
            >
              <Input
                id="publicName"
                {...register('publicName', { required: 'Required' })}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Type" htmlFor="discountType" required>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="discountType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat">
                          Flat amount ({CURRENCY})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>

              <Field
                label="Value"
                htmlFor="discountValue"
                required
                error={errors.discountValue?.message}
              >
                <NumericInput
                  id="discountValue"
                  variant="decimal"
                  placeholder="10"
                  control={control}
                  name="discountValue"
                  rules={{
                    required: 'Required',
                    validate: (value) =>
                      Number(value) > 0 || 'Must be greater than zero',
                  }}
                />
              </Field>
            </div>

            <Field
              label="Code"
              htmlFor="discountCode"
              required
              error={errors.discountCode?.message}
              hint="What buyers type at checkout"
            >
              <Input
                id="discountCode"
                {...register('discountCode', {
                  required: 'Required',
                  pattern: {
                    value: /^[A-Z0-9-]{3,20}$/,
                    message: '3–20 chars: A–Z, 0–9 and dashes',
                  },
                })}
                placeholder="LAUNCH10"
                className="font-mono uppercase"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create code'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Delete “${toDelete?.discountCode}”?`}
        description="Buyers will no longer be able to apply this code. It is also detached from any products using it."
        confirmLabel="Delete code"
        destructive
        pending={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}
