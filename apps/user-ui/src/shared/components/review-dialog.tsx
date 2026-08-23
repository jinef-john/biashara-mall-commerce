'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@biashara-mall/ui/components/ui/dialog';
import { Textarea } from '@biashara-mall/ui/components/ui/textarea';
import { RatingInput } from './rating-input';

export interface ExistingReview {
  rating: number;
  review: string | null;
}

export function ReviewDialog({
  open,
  onOpenChange,
  title,
  subject,
  existing,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subject: string;
  existing: ExistingReview | null;
  pending: boolean;
  onSubmit: (rating: number, review: string) => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [text, setText] = useState(existing?.review ?? '');

  // The dialog stays mounted between subjects, so its fields have to follow
  // whichever item was just opened.
  useEffect(() => {
    if (open) {
      setRating(existing?.rating ?? 0);
      setText(existing?.review ?? '');
    }
  }, [open, existing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subject}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <RatingInput value={rating} onChange={setRating} disabled={pending} />
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What should other buyers know? (optional)"
            maxLength={2000}
            rows={5}
            disabled={pending}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(rating, text)}
            disabled={rating === 0 || pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            {existing ? 'Update review' : 'Post review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
