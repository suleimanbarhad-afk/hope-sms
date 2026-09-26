import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
      });
      setDone(true);
      toast.success("Password reset");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} /> Back to login
        </Link>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
            <h2 className="text-xl font-bold">Password updated!</h2>
            <p className="text-sm text-slate-500 mt-2">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold">Reset Password</h2>
              <p className="text-sm text-slate-500">
                Choose a new password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  {...register("password", {
                    required: "Required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.password.message}
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
                  {...register("confirm", {
                    required: "Required",
                    validate: (v) => v === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirm && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirm.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                <KeyRound size={16} />
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}