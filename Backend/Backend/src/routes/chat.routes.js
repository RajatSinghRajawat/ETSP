import {
  getConversations,
  getMessages,
  getUnreadCount,
  markRead,
  postMessage,
  startConversation,
} from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/auth.js';

export async function chatRoutes(app) {
  app.get('/conversations', { preHandler: authenticate }, getConversations);
  app.get('/conversations/:id/messages', { preHandler: authenticate }, getMessages);
  app.post('/conversations', { preHandler: authenticate }, startConversation);
  app.post('/conversations/:id/messages', { preHandler: authenticate }, postMessage);
  app.patch('/conversations/:id/read', { preHandler: authenticate }, markRead);
  app.get('/unread-count', { preHandler: authenticate }, getUnreadCount);
}
