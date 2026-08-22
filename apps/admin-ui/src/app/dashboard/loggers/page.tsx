'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, Trash2 } from 'lucide-react';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Button } from '@biashara-mall/ui/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@biashara-mall/ui/components/ui/tabs';

const SOCKET_URI = process.env.NEXT_PUBLIC_SOCKET_URI ?? 'ws://localhost:6008';
const MAX_LINES = 2000;

type LogType = 'error' | 'success' | 'warning' | 'info' | 'debug';

interface LogEvent {
  type: LogType;
  message: string;
  source: string;
  timestamp: string;
}

const COLOURS: Record<LogType, string> = {
  error: 'text-red-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  info: 'text-sky-400',
  debug: 'text-zinc-400',
};

const FILTERS = [
  { value: 'all', label: 'All', key: '0' },
  { value: 'error', label: 'Errors', key: '1' },
  { value: 'success', label: 'Success', key: '2' },
  { value: 'warning', label: 'Warnings', key: '3' },
  { value: 'info', label: 'Info', key: '4' },
] as const;

export default function LoggersPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let socket: WebSocket;
    let reconnect: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      socket = new WebSocket(SOCKET_URI);
      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => {
        if (pausedRef.current) return;
        const payload = JSON.parse(event.data);
        if (payload.type !== 'LOGS') return;
        setLogs((current) => [...current, ...payload.logs].slice(-MAX_LINES));
      };
      socket.onclose = () => {
        setConnected(false);
        if (!closed) reconnect = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(reconnect);
      socket?.close();
    };
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? logs : logs.filter((log) => log.type === filter)),
    [logs, filter],
  );

  useEffect(() => {
    if (!paused) endRef.current?.scrollIntoView({ block: 'end' });
  }, [visible.length, paused]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const match = FILTERS.find((f) => f.key === event.key);
      if (match) setFilter(match.value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const download = useCallback(() => {
    const body = visible
      .map((log) => `[${log.timestamp}] ${log.type.toUpperCase()} ${log.source}: ${log.message}`)
      .join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `biashara-mall-${new Date().toISOString().slice(0, 10)}.log`;
    link.click();
    URL.revokeObjectURL(url);
  }, [visible]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-lg text-on-surface">Logs</h1>
          <p className="text-body-md text-on-surface-variant">
            Live stream from every service. Press 0-4 to filter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? 'Connected' : 'Reconnecting…'}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? <Play /> : <Pause />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setLogs([])}>
            <Trash2 />
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={download}
            disabled={visible.length === 0}
          >
            <Download />
            Download
          </Button>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="border border-outline-variant bg-surface-container">
          {FILTERS.map((f) => (
            <TabsTrigger
              key={f.value}
              value={f.value}
              className="px-4 font-medium data-[state=active]:bg-primary data-[state=active]:text-on-primary"
            >
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="h-[calc(100dvh-20rem)] min-h-80 overflow-y-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs">
        {visible.length === 0 ? (
          <p className="text-zinc-500">
            Waiting for events… logs appear here as services emit them.
          </p>
        ) : (
          visible.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} className="flex gap-2 py-0.5">
              <span className="shrink-0 text-zinc-600">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span className={`w-16 shrink-0 uppercase ${COLOURS[log.type]}`}>
                {log.type}
              </span>
              <span className="w-40 shrink-0 truncate text-zinc-500">{log.source}</span>
              <span className="break-all text-zinc-200">{log.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
