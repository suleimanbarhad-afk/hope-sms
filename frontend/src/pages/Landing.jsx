import { Link } from "react-router-dom";
import {
  GraduationCap, Users, BookOpen, ClipboardList, Megaphone, Shield, Bell, BarChart3,
  Mail, Phone, MapPin,
} from "lucide-react";

const features = [
  { icon: Users, title: "Student Management", desc: "Centralized student records with full lifecycle management." },
  { icon: BarChart3, title: "Academic Results", desc: "Automated grading, GPA/CGPA and transcript generation." },
  { icon: BookOpen, title: "Course Management", desc: "Manage courses, syllabi, and lecturer assignments." },
  { icon: ClipboardList, title: "Attendance Tracking", desc: "Real-time attendance with percentage reports." },
  { icon: Megaphone, title: "Announcements", desc: "Broadcast important updates across the university." },
  { icon: Shield, title: "Secure Authentication", desc: "JWT-based security with role-based access." },
  { icon: Bell, title: "Notifications", desc: "Instant alerts for results, fees, and deadlines." },
  { icon: GraduationCap, title: "Reports & Analytics", desc: "Comprehensive reports exportable to CSV/PDF." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-blue-600" size={28} />
            <span className="font-bold text-lg">UniManage</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm text-slate-600">
            <a href="#home" className="hover:text-blue-600">Home</a>
            <a href="#about" className="hover:text-blue-600">About</a>
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#contact" className="hover:text-blue-600">Contact</a>
          </div>
          <div className="flex gap-2">
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="bg-gradient-to-br from-blue-600 to-blue-900 text-white py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Smart Student Management System</h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Manage academic information, student services, results, attendance and university
            communication in one secure platform.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/login"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50"
            >
              Login to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Powerful Features</h2>
        <p className="text-center text-slate-500 mb-12">
          Everything you need to run a modern university portal.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">About the Platform</h2>
            <p className="text-slate-600 mb-4">
              Our Student Management System is a modern, secure and scalable web application
              designed for universities and colleges. It brings together all the academic
              operations into a single unified portal.
            </p>
            <p className="text-slate-600">
              Students can access their records, register courses, view results and track attendance.
              Administrators get powerful tools to manage students, courses, results, fees and
              institutional reports.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["10k+", "Students"],
              ["500+", "Courses"],
              ["50+", "Programs"],
              ["99.9%", "Uptime"],
            ].map(([n, l]) => (
              <div key={l} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
                <div className="text-3xl font-bold text-blue-600">{n}</div>
                <div className="text-sm text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Contact Us</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
            <Mail className="mx-auto text-blue-600 mb-3" />
            <p className="font-medium">Email</p>
            <p className="text-sm text-slate-500">info@university.edu</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
            <Phone className="mx-auto text-blue-600 mb-3" />
            <p className="font-medium">Phone</p>
            <p className="text-sm text-slate-500">+1 234 567 890</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-center">
            <MapPin className="mx-auto text-blue-600 mb-3" />
            <p className="font-medium">Address</p>
            <p className="text-sm text-slate-500">123 University Ave</p>
          </div>
        </div>
        <form className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-3">
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="Your Name"
          />
          <input
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="Your Email"
          />
          <textarea
            rows={4}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="Your Message"
          />
          <button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg"
          >
            Send Message
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-10">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="text-blue-500" size={24} />
              <span className="font-bold text-white">UniManage</span>
            </div>
            <p className="text-sm">Modern student management for universities and colleges.</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Quick Links</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#contact" className="hover:text-white">Contact</a></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Follow Us</h4>
            <div className="flex gap-3 text-sm">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">Facebook</a>
              <a href="#" className="hover:text-white">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500 mt-8">
          © {new Date().getFullYear()} UniManage. All rights reserved.
        </div>
      </footer>
    </div>
  );
}