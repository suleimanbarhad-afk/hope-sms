import Notification from "../models/Notification.js";
import { emitToUser } from "../config/socket.js";

/**
 * Create a notification AND push it live via socket to the recipient.
 */
export const notifyUser = async ({
  recipient,
  title,
  message,
  type = "general",
  link = "",
}) => {
  try {
    const notif = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
    });

    // Push live to that user
    emitToUser(recipient, "notification:new", {
      _id: notif._id,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: notif.createdAt,
    });

    // Send updated unread count
    const count = await Notification.countDocuments({
      recipient,
      read: false,
    });
    emitToUser(recipient, "notifications:count", count);

    return notif;
  } catch (err) {
    console.error("notifyUser error:", err.message);
    return null;
  }
};

/**
 * Notify many users at once.
 */
export const notifyMany = async (userIds, data) => {
  for (const userId of userIds) {
    await notifyUser({ recipient: userId, ...data });
  }
};