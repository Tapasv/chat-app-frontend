import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { MessageCircle, UserPlus } from "lucide-react";
import apiauth from "../apiauth";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
  const [Username, setUsername] = useState("");
  const [Password, setPassword] = useState("");
  const [role, setrole] = useState("");
  const [Email, setemail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleregister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
    ];
    const emailDomain = Email.toLowerCase().split("@")[1];
    if (!allowedDomains.includes(emailDomain)) {
      toast.error("Please use Gmail, Yahoo, or Outlook email");
      return;
    }

    if (!Username || !Password) {
      toast.error("Username and Password cannot be empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await apiauth.post("/register", {
        Username,
        Password,
        Email,
        role,
      });

      toast.success(res.data.message || `User ${Username} created`);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
      <ToastContainer />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-black text-white p-3 rounded-full mb-3">
            <MessageCircle size={26} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Create Account
          </h1>
          <p className="text-sm text-gray-500">
            Join Chatify and start chatting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleregister} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              value={Username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={Email}
              onChange={(e) => setemail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={Password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              onChange={(e) => setrole(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-black focus:outline-none transition"
            >
              <option value="">User (default)</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} />
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-black font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
