import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { Authcntxt } from "../context/authcontext";
import { User, Mail, Lock, Check, ArrowLeft, Eye, EyeOff, Camera } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const EditProfile = () => {
    const navigate = useNavigate();
    const { user: contextUser, login } = useContext(Authcntxt);
    
    // All fields start EMPTY
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordVerified, setPasswordVerified] = useState(false);
    
    // Password visibility states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Profile picture
    const [profilePreview, setProfilePreview] = useState(null);
    const profileInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [verifyingPassword, setVerifyingPassword] = useState(false);

    useEffect(() => {
        if (!contextUser) {
            navigate('/login');
            return;
        }
        // Don't load values - keep fields empty
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
            
            const updatedUser = { ...contextUser, Username: username };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            login(updatedUser, token, localStorage.getItem("refreshToken"));
            
            toast.success(res.data.message);
            setUsername("");
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
            setEmail("");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send verification email");
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Profile picture must be less than 5MB');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload
        const formData = new FormData();
        formData.append('profilePicture', file);

        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`${SERVER_URL}/api/profile/upload-profile-picture`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Profile picture updated!');
            const updatedUser = { ...contextUser, profilePicture: res.data.profilePicture };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            login(updatedUser, localStorage.getItem("accessToken"), localStorage.getItem("refreshToken"));
            
            setProfilePreview(null);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to upload profile picture');
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

            {/* Profile Picture Section - MOVED TO TOP */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={20} /> Profile Picture
                </h3>
                
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px'
                }}>
                    <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem'
                    }}>
                        {profilePreview || contextUser?.profilePicture ? (
                            <img 
                                src={profilePreview || contextUser.profilePicture} 
                                alt="Profile" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            contextUser?.Username?.[0] || 'U'
                        )}
                    </div>
                    
                    <input
                        type="file"
                        ref={profileInputRef}
                        onChange={handleProfilePictureUpload}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                    
                    <button 
                        onClick={() => profileInputRef.current?.click()}
                        disabled={loading}
                        style={{ width: 'auto' }}
                    >
                        {loading ? "Uploading..." : "Choose Picture"}
                    </button>
                </div>
            </div>

            <hr style={{ margin: '2rem 0', border: '1px solid rgba(255,255,255,0.1)' }} />

            {/* Username Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Update Username
                </h3>
                <label>
                    <b>New Username:</b>
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    setPasswordVerified(false);
                                }}
                                placeholder="Enter current password"
                                style={{ width: '100%', paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: 'auto'
                                }}
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button 
                            onClick={handleVerifyPassword}
                            disabled={verifyingPassword || !currentPassword}
                            style={{
                                padding: '0.75rem 1rem',
                                background: passwordVerified ? '#10b981' : 'var(--primary)',
                                minWidth: '90px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {passwordVerified ? <Check size={18} /> : 'Verify'}
                        </button>
                    </div>
                </label>

                <label>
                    <b>New Password:</b>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            disabled={!passwordVerified}
                            style={{
                                width: '100%',
                                paddingRight: '2.5rem',
                                opacity: passwordVerified ? 1 : 0.5,
                                cursor: passwordVerified ? 'text' : 'not-allowed'
                            }}
                        />
                        {passwordVerified && (
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: 'auto'
                                }}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}
                    </div>
                </label>

                <label>
                    <b>Confirm New Password:</b>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            disabled={!passwordVerified}
                            style={{
                                width: '100%',
                                paddingRight: '2.5rem',
                                opacity: passwordVerified ? 1 : 0.5,
                                cursor: passwordVerified ? 'text' : 'not-allowed'
                            }}
                        />
                        {passwordVerified && (
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: 'auto'
                                }}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}
                    </div>
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
        </div>
    );
};

export default EditProfile;