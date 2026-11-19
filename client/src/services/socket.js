import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  socket = io('/', {
    withCredentials: true,
    transports: ['websocket', 'polling'],
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
