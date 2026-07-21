import { ManagerOptions, SocketOptions } from 'socket.io-client';
import { env } from '../../../environments/env';

export function normalizeSocketUrl(url: string): string {
  return url.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
}

/** Long-polling is reliable behind nginx/PM2; websocket upgrade is attempted when enabled. */
export function getSocketClientOptions(): Partial<ManagerOptions & SocketOptions> {
  const transports = env.SOCKET_TRANSPORTS?.length
    ? env.SOCKET_TRANSPORTS
    : (['polling', 'websocket'] as ('polling' | 'websocket')[]);

  return {
    path: '/socket.io/',
    withCredentials: true,
    transports,
    upgrade: transports.includes('websocket'),
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  };
}
