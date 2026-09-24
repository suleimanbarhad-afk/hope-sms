import Notification from "../models/Notification.js";

// ============================================================
// GET /api/notifications — current user's notifications
// ============================================================
export const getMyNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unread === "true";

    const filter = { recipient: req.user._id };
    if (unreadOnly) filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/notifications/unread-count
// ============================================================
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUT /api/notifications/:id/read
// ============================================================
export const markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json(notif);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUT /api/notifications/read-all
// ============================================================
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({
      message: `${result.modifiedCount} marked as read`,
      count: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE /api/notifications/:id
// ============================================================
export const deleteNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE /api/notifications — clear all for current user
// ============================================================
export const clearAll = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: `${result.deletedCount} deleted`, count: result.deletedCount });
  } catch (err) {
    next(err);
  }
};