import { Notification } from '../models/notification.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
import { emitNotification } from '../socket/socket.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function serialize(notification) {
  return {
    _id: String(notification._id),
    type: notification.type,
    title: notification.title,
    message: notification.message ?? '',
    link: notification.link ?? '',
    read: Boolean(notification.readAt),
    readAt: notification.readAt ?? null,
    meta: notification.meta ?? {},
    createdAt: notification.createdAt,
  };
}

function requireUser(user) {
  if (!user?.email || !user?.role) {
    throw new AppError('Authentication required', 401);
  }

  return String(user.email).toLowerCase();
}

/**
 * Persist a notification and push it over the socket.
 *
 * Never throws: notifications are a side effect of the flow that triggered them
 * (an application, a status change) and must not fail that flow.
 */
export async function createNotification({
  recipientEmail,
  recipientRole,
  type,
  title,
  message = '',
  link = '',
  meta = {},
}) {
  if (!recipientEmail || !recipientRole || !title) {
    return null;
  }

  try {
    const notification = await Notification.create({
      recipientEmail,
      recipientRole,
      type,
      title,
      message,
      link,
      meta,
    });

    const payload = serialize(notification.toObject());
    emitNotification(recipientEmail, payload);

    return payload;
  } catch (error) {
    logger.warn('Notification create failed', { message: error.message, recipientEmail, type });
    return null;
  }
}

/** Fire-and-forget wrapper for call sites that must not await the write. */
export function notify(input) {
  setImmediate(() => {
    createNotification(input).catch(() => {});
  });
}

export async function getMyNotifications(user, query = {}) {
  const email = requireUser(user);
  const page = toPositiveNumber(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (page - 1) * limit;
  const filters = { recipientEmail: email };

  if (String(query.unread) === 'true') {
    filters.readAt = null;
  }

  const [items, total, unread] = await Promise.all([
    Notification.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filters),
    Notification.countDocuments({ recipientEmail: email, readAt: null }),
  ]);

  return {
    items: items.map(serialize),
    unread,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

export async function getMyUnreadNotificationCount(user) {
  const email = requireUser(user);
  const unread = await Notification.countDocuments({ recipientEmail: email, readAt: null });

  return { unread };
}

export async function markNotificationRead(user, id) {
  const email = requireUser(user);

  if (!isObjectId(id)) {
    throw new AppError('Invalid notification id', 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientEmail: email, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();

  if (!notification) {
    // Already read (or not this user's) — treat as a no-op rather than an error.
    const existing = await Notification.findOne({ _id: id, recipientEmail: email }).lean();

    if (!existing) {
      throw new AppError('Notification not found', 404);
    }

    return serialize(existing);
  }

  return serialize(notification);
}

export async function markAllNotificationsRead(user) {
  const email = requireUser(user);
  const result = await Notification.updateMany(
    { recipientEmail: email, readAt: null },
    { $set: { readAt: new Date() } },
  );

  return { updated: result.modifiedCount ?? 0, unread: 0 };
}

export async function deleteNotification(user, id) {
  const email = requireUser(user);

  if (!isObjectId(id)) {
    throw new AppError('Invalid notification id', 400);
  }

  const deleted = await Notification.findOneAndDelete({ _id: id, recipientEmail: email }).lean();

  if (!deleted) {
    throw new AppError('Notification not found', 404);
  }

  return { _id: String(deleted._id) };
}
