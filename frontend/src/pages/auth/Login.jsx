import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { GraduationCap } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { login, loading } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const onSubmit = async (data) => {
    try {
      setServerError("");
      const user = await login(data.email, data.password);
      toast.success("Login successful");
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "lecturer") navigate("/lecturer/dashboard");
      else navigate("/student/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Something went wrong. Please try again.";
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-primary-600 to-primary-900 text-white p-10">
        <GraduationCap size={60} className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Hope SMS</h1>
        <p className="text-primary-100 text-center max-w-sm">
          Login to access your academic dashboard, results, courses and more.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md card space-y-4"
        >
          <div>
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>

          {serverError && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
              {serverError}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-xs text-slate-500">
            Accounts are created by the administrator.
            <br />
            Please contact your department office for access.
          </p>
        </form>
      </div>
    </div>
  );
}