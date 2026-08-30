import {
  deleteNotification,
  getMyNotifications,
  getMyUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notification.service.js';

export async function getNotifications(request) {
  const data = await getMyNotifications(request.user, request.query);

  return {
    success: true,
    message: 'Notifications fetched successfully',
    data,
  };
}

export async function getUnreadNotificationCount(request) {
  const data = await getMyUnreadNotificationCount(request.user);

  return {
    success: true,
    message: 'Unread notification count fetched successfully',
    data,
  };
}

export async function patchNotificationRead(request) {
  const data = await markNotificationRead(request.user, request.params.id);

  return {
    success: true,
    message: 'Notification marked as read',
    data,
  };
}

export async function postReadAllNotifications(request) {
  const data = await markAllNotificationsRead(request.user);

  return {
    success: true,
    message: 'All notifications marked as read',
    data,
  };
}

export async function removeNotification(request) {
  const data = await deleteNotification(request.user, request.params.id);

  return {
    success: true,
    message: 'Notification deleted successfully',
    data,
  };
}
