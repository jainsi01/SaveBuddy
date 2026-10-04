const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * List Notifications for logged-in user (FR-09, API Spec 8.2)
 * GET /api/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const unreadOnly = req.query.unreadOnly === 'true';

  const filter = { userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  res.status(200).json({
    success: true,
    data: notifications.map((n) => n.toJSON()),
    meta: {
      unreadCount,
    },
  });
});

/**
 * Mark a single notification as read (API Spec 8.3)
 * PUT /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const notificationId = req.params.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    return next(new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
  });
});

/**
 * Mark all notifications as read (Idempotent, API Spec 8.4, EC-7.4)
 * PUT /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    data: {
      updatedCount: result.modifiedCount || 0,
    },
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
