import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  const isRemote = Boolean(import.meta.env.VITE_SOCKET_URL);
  socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
    path: import.meta.env.VITE_SOCKET_PATH || '/socket.io',
    withCredentials: true,
    // Vercel Functions only support WebSocket upgrades; keep polling locally.
    transports: isRemote ? ['websocket'] : ['websocket', 'polling'],
    autoConnect: true,
    reconnectionAttempts: 8,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
