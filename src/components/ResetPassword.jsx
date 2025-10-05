import { useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
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

        setIsSubmitting(true)

        try {
            const res = await apiauth.post(`/reset-password/${token}`, {
                Password: password  // Changed from lowercase to uppercase
            });
            toast.success(res.data.message);

            setTimeout(() => {
                navigate('/login');  // Changed from '/' to '/login'
            }, 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
            setIsSubmitting(false); 
        }
    };

    return (
        <div className="Login-div">
            <h1>Reset Password</h1>

            <form onSubmit={handleSubmit}>
                <label>
                    <b>New Password:</b>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                <label>
                    <b>Confirm Password:</b>
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Resetting" : "Reset Password"}
                </button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default ResetPassword;