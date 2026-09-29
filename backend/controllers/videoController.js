import VideoRoom from "../models/VideoRoom.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Attendance from "../models/Attendance.js";

// ============================================================
// POST /api/video/start
// Lecturer/Admin starts a class
// ============================================================
export const startClass = async (req, res, next) => {
  try {
    const { courseId, title } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ message: "courseId and title required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (
      req.user.role === "lecturer" &&
      (!course.lecturer || course.lecturer.toString() !== req.user._id.toString())
    ) {
      return res
        .status(403)
        .json({ message: "You can only start classes for your own courses" });
    }

    // Check for existing live room
    const existing = await VideoRoom.findOne({
      course: courseId,
      status: "live",
    });
    if (existing) {
      return res.json({ room: existing, alreadyLive: true });
    }

    const roomName = `course-${course.code}-${Date.now()}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const room = await VideoRoom.create({
      name: roomName,
      course: courseId,
      lecturer: req.user._id,
      title,
      status: "live",
      participants: [{ user: req.user._id }],
    });

    const populated = await VideoRoom.findById(room._id)
      .populate("course", "code name")
      .populate("lecturer", "firstName lastName");

    res.status(201).json({ room: populated });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/video/live
// List live classes (students see only their enrolled courses)
// ============================================================
export const getLiveClasses = async (req, res, next) => {
  try {
    const filter = { status: "live" };

    if (req.user.role === "student") {
      const enrollments = await Enrollment.find({
        student: req.user._id,
      }).select("course");
      filter.course = { $in: enrollments.map((e) => e.course) };
    }

    const classes = await VideoRoom.find(filter)
      .populate("course", "code name")
      .populate("lecturer", "firstName lastName")
      .populate("participants.user", "firstName lastName role")
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/video/room/:roomId
// Get room details before joining
// ============================================================
export const getRoom = async (req, res, next) => {
  try {
    const room = await VideoRoom.findById(req.params.roomId)
      .populate("course", "code name")
      .populate("lecturer", "firstName lastName");

    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.status !== "live") {
      return res.status(400).json({ message: "This class has ended" });
    }

    // Students must be enrolled
    if (req.user.role === "student") {
      const enrolled = await Enrollment.findOne({
        student: req.user._id,
        course: room.course._id,
      });
      if (!enrolled) {
        return res
          .status(403)
          .json({ message: "You are not enrolled in this course" });
      }
    }

    res.json(room);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUT /api/video/end/:roomId
// Lecturer ends class + auto-mark attendance for participants
// ============================================================
export const endClass = async (req, res, next) => {
  try {
    const room = await VideoRoom.findById(req.params.roomId).populate("course");
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (
      req.user.role === "lecturer" &&
      room.lecturer.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You can only end your own classes" });
    }

    room.status = "ended";
    room.endedAt = new Date();
    await room.save();

    res.json({ message: "Class ended", room });
  } catch (err) {
    next(err);
  }
};