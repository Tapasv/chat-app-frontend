import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { Authcntxt } from "../context/authcontext";
import {
  User,
  Mail,
  Lock,
  Check,
  ArrowLeft,
  Eye,
  EyeOff,
  Camera
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const EditProfile = () => {
  const navigate = useNavigate();
  const { user: contextUser, login } = useContext(Authcntxt);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profilePreview, setProfilePreview] = useState(null);
  const profileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  useEffect(() => {
    if (!contextUser) navigate("/login");
  }, [contextUser, navigate]);

  const getProfileImage = () => {
    if (profilePreview) return profilePreview;
    if (contextUser?.profilePicture) {
      return contextUser.profilePicture.startsWith("http")
        ? contextUser.profilePicture
        : `${SERVER_URL}${contextUser.profilePicture}`;
    }
    return null;
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be under 5MB");

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type))
      return toast.error("Invalid image format");

    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("profilePicture", file);

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${SERVER_URL}/api/profile/upload-profile-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const updatedUser = {
        ...contextUser,
        profilePicture: res.data.profilePicture
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      login(updatedUser, token, localStorage.getItem("refreshToken"));

      toast.success("Profile picture updated");
      setProfilePreview(null);
    } catch {
      toast.error("Failed to upload picture");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) return toast.error("Username required");

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${SERVER_URL}/api/profile/update-username`,
        { Username: username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...contextUser, Username: username };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      login(updatedUser, token, localStorage.getItem("refreshToken"));

      toast.success("Username updated");
      setUsername("");
    } catch {
      toast.error("Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!email.trim()) return toast.error("Email required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return toast.error("Invalid email");

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${SERVER_URL}/api/profile/request-email-change`,
        { newEmail: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Verification email sent");
      setEmail("");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!currentPassword) return toast.error("Enter current password");

    setVerifyingPassword(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${SERVER_URL}/api/profile/verify-password`,
        { currentPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordVerified(true);
      toast.success("Password verified");
    } catch {
      toast.error("Incorrect password");
      setPasswordVerified(false);
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6)
      return toast.error("Minimum 6 characters");

    if (newPassword !== confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${SERVER_URL}/api/profile/update-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordVerified(false);
    } catch {
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/chat")}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-semibold">Edit Profile</h1>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-8">
            {/* PROFILE PIC */}
            <div className="bg-gray-900 p-6 rounded-xl">
              <h3 className="flex items-center gap-2 mb-4">
                <Camera size={18} /> Profile Picture
              </h3>

              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-4xl font-bold">
                  {getProfileImage() ? (
                    <img src={getProfileImage()} className="w-full h-full object-cover" />
                  ) : (
                    contextUser?.Username?.[0] || "U"
                  )}
                </div>

                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                />

                <button
                  disabled={loading}
                  onClick={() => profileInputRef.current.click()}
                  className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  {loading ? "Uploading..." : "Change Picture"}
                </button>
              </div>
            </div>

            {/* USERNAME */}
            <div className="bg-gray-900 p-6 rounded-xl">
              <h3 className="flex items-center gap-2 mb-2">
                <User size={18} /> Username
              </h3>
              <p className="text-sm text-gray-400 mb-2">
                Current: {contextUser?.Username}
              </p>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="New username"
                className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-3 outline-none"
              />

              <button
                onClick={handleUpdateUsername}
                disabled={loading}
                className="w-full bg-blue-600 py-2 rounded-lg"
              >
                Update Username
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            {/* EMAIL */}
            <div className="bg-gray-900 p-6 rounded-xl">
              <h3 className="flex items-center gap-2 mb-3">
                <Mail size={18} /> Change Email
              </h3>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="New email"
                className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-3 outline-none"
              />

              <button
                onClick={handleChangeEmail}
                disabled={loading}
                className="w-full bg-blue-600 py-2 rounded-lg"
              >
                Send Verification Email
              </button>
            </div>

            {/* PASSWORD */}
            <div className="bg-gray-900 p-6 rounded-xl">
              <h3 className="flex items-center gap-2 mb-4">
                <Lock size={18} /> Change Password
              </h3>

              <div className="relative mb-3">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordVerified(false);
                  }}
                  placeholder="Current password"
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 pr-10"
                />
                <button
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                onClick={handleVerifyPassword}
                disabled={verifyingPassword}
                className={`w-full py-2 rounded-lg mb-4 ${
                  passwordVerified ? "bg-green-600" : "bg-blue-600"
                }`}
              >
                {passwordVerified ? <Check /> : "Verify Password"}
              </button>

              <input
                disabled={!passwordVerified}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-3"
              />

              <input
                disabled={!passwordVerified}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-4"
              />

              <button
                disabled={!passwordVerified || loading}
                onClick={handleUpdatePassword}
                className="w-full bg-blue-600 py-2 rounded-lg"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/chat")}
          className="mt-10 w-full bg-gray-800 py-2 rounded-lg"
        >
          Back to Chat
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
