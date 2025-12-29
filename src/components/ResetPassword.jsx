import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { MessageCircle, Lock } from "lucide-react";
import apiauth from "../apiauth";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiauth.post(`/reset-password/${token}`, {
        Password: password
      });

      toast.success(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <ToastContainer />

      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-lg p-8 text-white">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <MessageCircle size={28} />
            <span className="text-xl font-semibold">Chatify</span>
          </div>
          <h2 className="text-xl font-semibold">Reset Password</h2>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Set a new password for your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-10 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-10 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6 text-center">
          After resetting, you’ll be redirected to login
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
