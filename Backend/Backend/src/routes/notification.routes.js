import {
  getNotifications,
  getUnreadNotificationCount,
  patchNotificationRead,
  postReadAllNotifications,
  removeNotification,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.js';

export async function notificationRoutes(app) {
  app.get('/', { preHandler: authenticate }, getNotifications);
  app.get('/unread-count', { preHandler: authenticate }, getUnreadNotificationCount);
  app.post('/read-all', { preHandler: authenticate }, postReadAllNotifications);
  app.patch('/:id/read', { preHandler: authenticate }, patchNotificationRead);
  app.delete('/:id', { preHandler: authenticate }, removeNotification);
}
