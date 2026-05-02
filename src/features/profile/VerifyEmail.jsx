import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import {
  MailCheck,
  MailX,
  Loader2,
  ArrowRight
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await axios.post(
          `${SERVER_URL}/api/profile/verify-email/${token}`
        );
        toast.success(res.data.message);
        setSuccess(true);

        setTimeout(() => {
          navigate("/chat");
        }, 3000);
      } catch (err) {
        toast.error(err.response?.data?.message || "Verification failed");
        setSuccess(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <ToastContainer />

      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-lg p-8 text-white text-center">
        {/* VERIFYING */}
        {verifying && (
          <>
            <Loader2
              size={42}
              className="mx-auto mb-4 animate-spin text-blue-500"
            />
            <h2 className="text-xl font-semibold mb-2">
              Verifying Email
            </h2>
            <p className="text-sm text-gray-400">
              Please wait while we verify your email address
            </p>
          </>
        )}

        {/* SUCCESS */}
        {!verifying && success && (
          <>
            <MailCheck
              size={42}
              className="mx-auto mb-4 text-green-500"
            />
            <h2 className="text-xl font-semibold mb-2">
              Email Verified!
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Your email has been successfully updated
            </p>
            <p className="text-xs text-gray-500">
              Redirecting you to chat…
            </p>
          </>
        )}

        {/* FAILED */}
        {!verifying && !success && (
          <>
            <MailX
              size={42}
              className="mx-auto mb-4 text-red-500"
            />
            <h2 className="text-xl font-semibold mb-2">
              Verification Failed
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              The verification link is invalid or has expired
            </p>

            <button
              onClick={() => navigate("/edit-profile")}
              className="w-full bg-gray-800 py-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
              Back to Edit Profile <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
