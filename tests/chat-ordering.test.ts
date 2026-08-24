import { describe, expect, test } from 'bun:test';
import type { ChatMessageEvent } from '@biashara-mall/kafka';
import { latestPerConversation } from '../apps/chatting-service/src/consumers/chat-message.consumer';

const message = (conversationId: string, createdAt: string): ChatMessageEvent =>
  ({ conversationId, createdAt }) as ChatMessageEvent;

describe('latestPerConversation', () => {
  test('one entry per conversation, whatever the batch size', () => {
    const latest = latestPerConversation([
      message('a', '2026-01-01T00:00:00.000Z'),
      message('a', '2026-01-01T00:00:01.000Z'),
      message('b', '2026-01-01T00:00:02.000Z'),
    ]);
    expect([...latest.keys()].sort()).toEqual(['a', 'b']);
  });

  test('keeps the newest timestamp, not the last one in the batch', () => {
    const latest = latestPerConversation([
      message('a', '2026-01-01T00:00:09.000Z'),
      message('a', '2026-01-01T00:00:03.000Z'),
    ]);
    expect(latest.get('a')).toBe('2026-01-01T00:00:09.000Z');
  });

  test('order within the batch does not change the answer', () => {
    const batch = [
      message('a', '2026-01-01T00:00:05.000Z'),
      message('a', '2026-01-01T00:00:07.000Z'),
      message('a', '2026-01-01T00:00:01.000Z'),
    ];
    expect(latestPerConversation(batch)).toEqual(
      latestPerConversation([...batch].reverse()),
    );
  });

  test('an empty batch touches nothing', () => {
    expect(latestPerConversation([]).size).toBe(0);
  });

  test('every conversation in a mixed batch gets its own newest', () => {
    const latest = latestPerConversation([
      message('a', '2026-01-01T00:00:01.000Z'),
      message('b', '2026-01-01T00:00:09.000Z'),
      message('a', '2026-01-01T00:00:04.000Z'),
      message('b', '2026-01-01T00:00:02.000Z'),
    ]);
    expect(latest.get('a')).toBe('2026-01-01T00:00:04.000Z');
    expect(latest.get('b')).toBe('2026-01-01T00:00:09.000Z');
  });
});
