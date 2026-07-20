import { io, type Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;
let currentToken: string | null = null;

/** Connect (or reuse) the chat socket for the given auth token. */
export function connectChatSocket(token: string): Socket {
  if (socket && currentToken === token) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = token;
  socket = io(API_BASE_URL, {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
