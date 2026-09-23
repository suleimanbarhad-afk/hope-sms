import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import { Lock, Save, KeyRound } from "lucide-react";

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const {
    register: registerPw,
    handleSubmit: handlePwSubmit,
    reset: resetPw,
    watch,
    formState: { errors: pwErrors },
  } = useForm();

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        studentId: user.studentId,
        department: user.department?.name || "—",
        program: user.program?.name || "—",
        yearOfStudy: user.yearOfStudy,
        semester: user.semester,
      });
    }
  }, [user, reset]);

  // Profile edit is disabled — kept for reference only
  const onSubmit = async () => {
    toast.error("Profile fields are managed by the administrator.");
  };

  const onChangePassword = async (data) => {
    try {
      setChangingPw(true);
      await api.put("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      resetPw();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  if (!user) return <Loader />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Summary card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center mx-auto mb-4">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>
          <h3 className="font-semibold">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-xs text-slate-500">{user.studentId}</p>
          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
            {user.status}
          </span>

          <div className="mt-4 text-left space-y-1 text-xs text-slate-600 border-t pt-3">
            <p>
              <span className="text-slate-400">Department:</span>{" "}
              {user.department?.name || "—"}
            </p>
            <p>
              <span className="text-slate-400">Program:</span>{" "}
              {user.program?.name || "—"}
            </p>
            <p>
              <span className="text-slate-400">Year:</span> {user.yearOfStudy}
            </p>
            <p>
              <span className="text-slate-400">Semester:</span> {user.semester}
            </p>
          </div>
        </div>

        {/* Right — Locked profile form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Personal Information</h3>
            <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <Lock size={12} />
              Locked — contact admin to change
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("firstName")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("lastName")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("email")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("phone")}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("address")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student ID
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("studentId")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department
              </label>
              <input
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2 cursor-not-allowed"
                {...register("department")}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
            To update your name, email, phone, or address, please contact the
            administrator.
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <form
        onSubmit={handlePwSubmit(onChangePassword)}
        className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 max-w-2xl space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-slate-500" />
          <h3 className="font-semibold">Change Password</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              {...registerPw("currentPassword", { required: "Required" })}
            />
            {pwErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">
                {pwErrors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              {...registerPw("newPassword", {
                required: "Required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />
            {pwErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">
                {pwErrors.newPassword.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              {...registerPw("confirmPassword", {
                required: "Required",
                validate: (v) =>
                  v === watch("newPassword") || "Passwords do not match",
              })}
            />
            {pwErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {pwErrors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={changingPw}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          <Save size={16} />
          {changingPw ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}