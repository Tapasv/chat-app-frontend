import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
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
                const res = await axios.post(`${SERVER_URL}/api/profile/verify-email/${token}`);
                toast.success(res.data.message);
                setSuccess(true);
                
                setTimeout(() => {
                    navigate('/chat');
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
        <div className="Login-div">
            {verifying ? (
                <>
                    <h1>Verifying Email...</h1>
                    <p>Please wait while we verify your email address.</p>
                </>
            ) : success ? (
                <>
                    <h1>✅ Email Verified!</h1>
                    <p>Your email has been successfully updated.</p>
                    <p>Redirecting to chat...</p>
                </>
            ) : (
                <>
                    <h1>❌ Verification Failed</h1>
                    <p>The verification link is invalid or has expired.</p>
                    <button onClick={() => navigate('/edit-profile')}>
                        Back to Edit Profile
                    </button>
                </>
            )}
            <ToastContainer />
        </div>
    );
};

export default VerifyEmail;