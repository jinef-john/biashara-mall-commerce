'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@biashara-mall/ui/components/ui/button';
import { Input } from '@biashara-mall/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@biashara-mall/ui/components/ui/popover';

// ssr:false — the picker touches window/navigator on import.
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export function ChatInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (body: string) => void;
}) {
  const [value, setValue] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = value.trim();
    if (!body) return;
    onSend(body);
    setValue('');
  };

  return (
    <form
      onSubmit={submit}
      className="flex shrink-0 items-center gap-2 border-t border-outline-variant p-3"
    >
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Emoji"
          >
            <Smile />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-auto border-none p-0">
          <EmojiPicker
            onEmojiClick={(emoji) => {
              setValue((current) => current + emoji.emoji);
              setPickerOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Type your message…"
        aria-label="Message"
        autoComplete="off"
        disabled={disabled}
        className="flex-1 rounded-full"
      />
      <Button
        type="submit"
        size="icon"
        className="rounded-full"
        disabled={disabled || !value.trim()}
        aria-label="Send"
      >
        <Send />
      </Button>
    </form>
  );
}
