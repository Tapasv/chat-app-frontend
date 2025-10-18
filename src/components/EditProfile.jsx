import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Authcntxt } from "../context/authcontext";
import { User, Mail, Lock, Check, X, ArrowLeft } from "lucide-react";
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
    
    const [loading, setLoading] = useState(false);
    const [verifyingPassword, setVerifyingPassword] = useState(false);

    useEffect(() => {
        if (!contextUser) {
            navigate('/login');
            return;
        }
        
        // Load user data
        const loadUserData = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await axios.get(`${SERVER_URL}/api/profile/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsername(res.data.Username);
                setEmail(res.data.Email);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load profile data");
            }
        };
        
        loadUserData();
    }, [contextUser, navigate]);

    const handleUpdateUsername = async () => {
        if (!username.trim()) {
            toast.error("Username cannot be empty");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(`${SERVER_URL}/api/profile/update-username`, 
                { Username: username },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            // Update localStorage
            const updatedUser = { ...contextUser, Username: username };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            login(updatedUser, token, localStorage.getItem("refreshToken"));
            
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update username");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPassword = async () => {
        if (!currentPassword) {
            toast.error("Please enter your current password");
            return;
        }

        setVerifyingPassword(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${SERVER_URL}/api/profile/verify-password`,
                { currentPassword },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            setPasswordVerified(true);
            toast.success("Password verified! You can now set a new password");
        } catch (err) {
            toast.error(err.response?.data?.message || "Incorrect password");
            setPasswordVerified(false);
        } finally {
            setVerifyingPassword(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error("Please fill in all password fields");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.put(`${SERVER_URL}/api/profile/update-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            toast.success(res.data.message);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordVerified(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = async () => {
        if (!email.trim()) {
            toast.error("Email cannot be empty");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`${SERVER_URL}/api/profile/request-email-change`,
                { newEmail: email },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send verification email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Login-div">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button 
                    onClick={() => navigate('/chat')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0 }}>Edit Profile</h1>
            </div>

            {/* Username Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Update Username
                </h3>
                <label>
                    <b>Username:</b>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter new username"
                    />
                </label>
                <button onClick={handleUpdateUsername} disabled={loading}>
                    {loading ? "Updating..." : "Update Username"}
                </button>
            </div>

            <hr style={{ margin: '2rem 0', border: '1px solid rgba(255,255,255,0.1)' }} />

            {/* Email Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={20} /> Change Email
                </h3>
                <label>
                    <b>New Email:</b>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter new email"
                    />
                </label>
                <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>
                    A verification link will be sent to your new email address
                </p>
                <button onClick={handleChangeEmail} disabled={loading}>
                    {loading ? "Sending..." : "Send Verification Email"}
                </button>
            </div>

            <hr style={{ margin: '2rem 0', border: '1px solid rgba(255,255,255,0.1)' }} />

            {/* Password Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={20} /> Change Password
                </h3>
                
                <label>
                    <b>Current Password:</b>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                setPasswordVerified(false);
                            }}
                            placeholder="Enter current password"
                            style={{ flex: 1 }}
                        />
                        <button 
                            onClick={handleVerifyPassword}
                            disabled={verifyingPassword || !currentPassword}
                            style={{
                                padding: '0.5rem 1rem',
                                background: passwordVerified ? '#10b981' : 'var(--primary)'
                            }}
                        >
                            {passwordVerified ? <Check size={18} /> : 'Verify'}
                        </button>
                    </div>
                </label>

                <label>
                    <b>New Password:</b>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        disabled={!passwordVerified}
                        style={{
                            opacity: passwordVerified ? 1 : 0.5,
                            cursor: passwordVerified ? 'text' : 'not-allowed'
                        }}
                    />
                </label>

                <label>
                    <b>Confirm New Password:</b>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={!passwordVerified}
                        style={{
                            opacity: passwordVerified ? 1 : 0.5,
                            cursor: passwordVerified ? 'text' : 'not-allowed'
                        }}
                    />
                </label>

                <button 
                    onClick={handleUpdatePassword} 
                    disabled={loading || !passwordVerified}
                    style={{
                        opacity: passwordVerified ? 1 : 0.5,
                        cursor: passwordVerified ? 'pointer' : 'not-allowed'
                    }}
                >
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </div>

            <hr style={{ margin: '2rem 0', border: '1px solid rgba(255,255,255,0.1)' }} />

            <button 
                onClick={() => navigate('/chat')}
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    width: '100%'
                }}
            >
                Back to Chat
            </button>

            <ToastContainer />
        </div>
    );
};

export default EditProfile;