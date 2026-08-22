import type { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import type { LogEvent } from '@biashara-mall/kafka';

const HISTORY_LIMIT = 500;

const clients = new Set<WebSocket>();
// Kept so a page opened after the fact still shows what already happened;
// a live tail that starts empty every time is useless for debugging.
let history: LogEvent[] = [];

export function broadcast(logs: LogEvent[]): void {
  if (logs.length === 0) return;
  history = [...history, ...logs].slice(-HISTORY_LIMIT);

  if (clients.size === 0) return;
  const payload = JSON.stringify({ type: 'LOGS', logs });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

export function clientCount(): number {
  return clients.size;
}

// noServer + a manual upgrade hook, so the same port keeps serving REST.
export function initWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws) => {
    clients.add(ws);
    if (history.length > 0) {
      ws.send(JSON.stringify({ type: 'LOGS', logs: history }));
    }
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });

  return wss;
}
