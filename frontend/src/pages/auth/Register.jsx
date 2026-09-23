import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function Register() {
  const { register: registerUser, loading } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const onSubmit = async (data) => {
    try {
      setServerError("");
      delete data.confirmPassword;
      await registerUser(data);
      toast.success("Registration successful");
      navigate("/student/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      setServerError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-2xl bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Create Student Account</h2>
          <p className="text-sm text-slate-500">Register to access the student portal</p>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{serverError}</div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("firstName", { required: "Required" })} />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("lastName", { required: "Required" })} />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("email", { required: "Required" })} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 characters" } })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              {...register("confirmPassword", {
                required: "Required",
                validate: (v) => v === watch("password") || "Passwords do not match",
              })}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("phone")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("gender")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}