import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },

    // Student fields
    studentId: { type: String, unique: true, sparse: true },

    // Lecturer fields
    staffId: { type: String, unique: true, sparse: true },

    phone: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    dateOfBirth: { type: Date },
    profileImage: { type: String, default: "" },
    address: { type: String, default: "" },

    // Role: student | admin | lecturer
    role: {
      type: String,
      enum: ["student", "admin", "lecturer"],
      default: "student",
    },

    // Academic (students)
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    program: { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
    yearOfStudy: { type: Number, default: 1 },
    semester: { type: Number, default: 1 },

    // Lecturer profile fields
    designation: { type: String, default: "" },     // e.g., "Senior Lecturer"
    officeRoom: { type: String, default: "" },      // e.g., "B-204"
    specialization: { type: String, default: "" },  // e.g., "Machine Learning"
    joiningDate: {
  type: Date,
  validate: {
    validator: function (v) {
      if (!v) return true;
      const year = new Date(v).getFullYear();
      return year >= 1950 && new Date(v) <= new Date();
    },
    message: "Joining date must be between 1950 and today",
  },
},
    qualifications: { type: String, default: "" },  // e.g., "PhD in CS"

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

userSchema.index({ role: 1, status: 1 });

export default mongoose.model("User", userSchema);