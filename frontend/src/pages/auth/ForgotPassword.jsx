import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", data);
      setSent(true);
      toast.success("Email sent");
      if (res.data.resetLink) {
        console.log("Dev reset link:", res.data.resetLink);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send email");
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

        {sent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-sm text-slate-500 mt-2">
              If an account exists for that email, we've sent a password reset
              link. It expires in 10 minutes.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-bold">Forgot Password?</h2>
              <p className="text-sm text-slate-500">
                Enter your email — we'll send a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="you@example.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
              >
                <Mail size={16} />
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}