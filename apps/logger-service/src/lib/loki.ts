import type { LogEvent } from '@biashara-mall/kafka';

const url = process.env.LOKI_PUSH_URL;
const user = process.env.LOKI_USER;
const token = process.env.LOKI_TOKEN;

export const lokiEnabled = Boolean(url && user && token);

const auth = lokiEnabled
  ? `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`
  : '';

// Loki wants nanosecond string timestamps, and one stream per label set.
function toStreams(logs: LogEvent[]) {
  const streams = new Map<string, { stream: Record<string, string>; values: [string, string][] }>();

  for (const log of logs) {
    const key = `${log.source}|${log.type}`;
    let entry = streams.get(key);
    if (!entry) {
      entry = {
        stream: { app: 'biashara-mall', service: log.source, level: log.type },
        values: [],
      };
      streams.set(key, entry);
    }
    const ns = `${new Date(log.timestamp).getTime()}000000`;
    entry.values.push([ns, log.message]);
  }

  return [...streams.values()];
}

// Never throws: log shipping must not take the consumer down with it.
export async function pushToLoki(logs: LogEvent[]): Promise<void> {
  if (!lokiEnabled || logs.length === 0) return;

  try {
    const response = await fetch(url!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ streams: toStreams(logs) }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(
        `[loki] push failed: ${response.status} ${await response.text().catch(() => '')}`,
      );
    }
  } catch (err) {
    console.error('[loki] push failed:', (err as Error).message);
  }
}
