import Announcement from "../models/Announcement.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";
import { announcementEmail } from "../utils/emailTemplates.js";

export const getAnnouncements = async (req, res, next) => {
  try {
    const filter = req.user?.role === "admin" ? {} : { published: true };
    const announcements = await Announcement.find(filter)
      .populate("author", "firstName lastName")
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.create({ ...req.body, author: req.user._id });

    // Fetch students with email — we need both IDs (for notifications) and emails
    const students = await User.find({
      role: "student",
      status: "active",
    }).select("_id firstName email");

    // 1. Create in-app notifications
    const notifs = students.map((s) => ({
      recipient: s._id,
      title: `New Announcement: ${ann.title}`,
      message: ann.description.slice(0, 100),
      type: "announcement",
      link: "/student/announcements",
    }));
    if (notifs.length) await Notification.insertMany(notifs);

    // 2. Send emails (fire-and-forget, best-effort)
    students.forEach((s) => {
      if (!s.email) return;
      const tpl = announcementEmail({
        firstName: s.firstName,
        title: ann.title,
        description: ann.description,
        priority: ann.priority,
      });
      sendEmail({
        to: s.email,
        subject: tpl.subject,
        html: tpl.html,
      }).catch(() => {});
    });

    res.status(201).json(ann);
  } catch (err) {
    next(err);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!ann) return res.status(404).json({ message: "Announcement not found" });
    res.json(ann);
  } catch (err) {
    next(err);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    next(err);
  }
};