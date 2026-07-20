import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { assertConversationAccess } from '../services/chat.service.js';

let io = null;

const userRoom = (email) => `user:${String(email).toLowerCase()}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

/**
 * Initialise the Socket.IO server on top of the existing HTTP server.
 * Authentication is enforced via JWT in the handshake — unauthenticated
 * sockets are rejected before they can join any room.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // JWT handshake auth.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '').trim();

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = jwt.verify(token, env.JWT_SECRET);
      socket.user = { id: payload.id, email: payload.email, role: payload.role };
      return next();
    } catch {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Personal room — used to notify a user about new messages / conversation updates.
    socket.join(userRoom(socket.user.email));

    socket.on('conversation:join', async (conversationId, ack) => {
      try {
        await assertConversationAccess(socket.user, conversationId);
        socket.join(conversationRoom(conversationId));
        if (typeof ack === 'function') ack({ ok: true });
      } catch (error) {
        if (typeof ack === 'function') ack({ ok: false, error: error.message });
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationRoom(conversationId));
    });

    // Lightweight typing indicator — relayed only to the conversation room.
    socket.on('typing', ({ conversationId, typing } = {}) => {
      if (!conversationId) return;
      socket.to(conversationRoom(conversationId)).emit('typing', {
        conversationId,
        senderRole: socket.user.role,
        typing: Boolean(typing),
      });
    });

    socket.on('error', (error) => {
      logger.warn('Socket error', { message: error?.message });
    });
  });

  logger.info('Socket.IO initialised');
  return io;
}

export function getIO() {
  return io;
}

/** Broadcast a newly persisted message to the conversation room. */
export function emitNewMessage(conversationId, message) {
  if (!io) return;
  io.to(conversationRoom(conversationId)).emit('message:new', message);
}

/** Notify both participants (via their personal rooms) that a conversation changed. */
export function emitConversationUpdate(conversation) {
  if (!io) return;
  const payload = { conversationId: String(conversation._id) };
  io.to(userRoom(conversation.employerEmail)).emit('conversation:updated', payload);
  io.to(userRoom(conversation.candidateEmail)).emit('conversation:updated', payload);
}
