import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

export default function LecturerProfile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get("/lecturer/profile")
      .then((r) => {
        setProfile(r.data);
        reset({
          firstName: r.data.firstName,
          lastName: r.data.lastName,
          email: r.data.email,
          phone: r.data.phone,
          address: r.data.address,
          officeRoom: r.data.officeRoom,
          specialization: r.data.specialization,
          qualifications: r.data.qualifications,
        });
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await api.put("/lecturer/profile", data);
      setProfile(res.data);
      setUser((u) => ({ ...u, ...res.data }));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Loader />;
  if (!profile) return <p className="text-slate-500">Failed to load profile.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center mx-auto mb-4">
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>
          <h3 className="font-semibold">{profile.firstName} {profile.lastName}</h3>
          <p className="text-xs text-slate-500">{profile.staffId}</p>
          <p className="text-xs text-slate-500 mt-1">{profile.designation || "Lecturer"}</p>
          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
            {profile.status}
          </span>

          <div className="mt-4 text-left space-y-1 text-xs text-slate-600 border-t pt-3">
            <p><span className="text-slate-400">Department:</span> {profile.department?.name || "—"}</p>
            <p><span className="text-slate-400">Office:</span> {profile.officeRoom || "—"}</p>
            <p><span className="text-slate-400">Specialization:</span> {profile.specialization || "—"}</p>
            <p><span className="text-slate-400">Qualifications:</span> {profile.qualifications || "—"}</p>
            <p>
              <span className="text-slate-400">Joined:</span>{" "}
              {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">Edit Profile</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("firstName")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("lastName")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("email")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Office Room</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("officeRoom")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("specialization")} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("qualifications")} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input className="w-full border border-slate-300 rounded-lg px-3 py-2" {...register("address")} />
            </div>
          </div>

          <button
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}