import {
  getConversationMessages,
  getMyUnreadTotal,
  listMyConversations,
  markConversationReadByUser,
  sendMessageToConversation,
  startConversationWithMessage,
} from '../services/chat.service.js';
import { emitConversationUpdate, emitNewMessage } from '../socket/socket.js';

export async function getConversations(request) {
  const items = await listMyConversations(request.user);

  return {
    success: true,
    message: 'Conversations fetched successfully',
    data: { items },
  };
}

export async function getMessages(request) {
  const data = await getConversationMessages(request.user, request.params.id);

  return {
    success: true,
    message: 'Messages fetched successfully',
    data,
  };
}

export async function startConversation(request, reply) {
  const { conversation, message } = await startConversationWithMessage(request.user, request.body);

  emitNewMessage(conversation._id, message);
  emitConversationUpdate(conversation);

  return reply.code(201).send({
    success: true,
    message: 'Message sent successfully',
    data: { conversationId: String(conversation._id), message },
  });
}

export async function postMessage(request, reply) {
  const { conversation, message } = await sendMessageToConversation(
    request.user,
    request.params.id,
    request.body?.text,
  );

  emitNewMessage(conversation._id, message);
  emitConversationUpdate(conversation);

  return reply.code(201).send({
    success: true,
    message: 'Message sent successfully',
    data: { conversationId: String(conversation._id), message },
  });
}

export async function markRead(request) {
  const data = await markConversationReadByUser(request.user, request.params.id);

  return {
    success: true,
    message: 'Conversation marked as read',
    data,
  };
}

export async function getUnreadCount(request) {
  const data = await getMyUnreadTotal(request.user);

  return {
    success: true,
    message: 'Unread count fetched successfully',
    data,
  };
}
