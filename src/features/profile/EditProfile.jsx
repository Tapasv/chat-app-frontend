import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { Authcntxt } from '../../context/authcontext';
import { User, Mail, Lock, Check, ArrowLeft, Eye, EyeOff, Camera } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';

const EditProfile = () => {
    const navigate = useNavigate();
    const { user: contextUser, login } = useContext(Authcntxt);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    const [loadingField, setLoadingField] = useState(null);
    const [verifyingPassword, setVerifyingPassword] = useState(false);
    const profileInputRef = useRef(null);

    useEffect(() => {
        if (!contextUser) navigate('/login');
    }, [contextUser, navigate]);

    const getProfileImage = () => {
        if (profilePreview) return profilePreview;
        if (contextUser?.profilePicture) return contextUser.profilePicture;
        return null;
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) return toast.error('Invalid image format');

        const reader = new FileReader();
        reader.onloadend = () => setProfilePreview(reader.result);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('profilePicture', file);

        setLoadingField('picture');
        try {
            const data = await api.post('/api/profile/upload-profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedUser = { ...contextUser, profilePicture: data.profilePicture };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            login(updatedUser, localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));
            toast.success('Profile picture updated');
            setProfilePreview(null);
        } catch {
            toast.error('Failed to upload picture');
            setProfilePreview(null);
        } finally {
            setLoadingField(null);
        }
    };

    const handleUpdateUsername = async () => {
        if (!username.trim()) return toast.error('Username required');
        setLoadingField('username');
        try {
            await api.put('/api/profile/update-username', { Username: username });
            const updatedUser = { ...contextUser, Username: username };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            login(updatedUser, localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));
            toast.success('Username updated');
            setUsername('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update username');
        } finally {
            setLoadingField(null);
        }
    };

    const handleChangeEmail = async () => {
        if (!email.trim()) return toast.error('Email required');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return toast.error('Invalid email format');

        setLoadingField('email');
        try {
            await api.post('/api/profile/request-email-change', { newEmail: email });
            toast.success('Verification email sent — check your inbox');
            setEmail('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send email');
        } finally {
            setLoadingField(null);
        }
    };

    const handleVerifyPassword = async () => {
        if (!currentPassword) return toast.error('Enter current password');
        setVerifyingPassword(true);
        try {
            await api.post('/api/profile/verify-password', { currentPassword });
            setPasswordVerified(true);
            toast.success('Password verified');
        } catch {
            toast.error('Incorrect password');
            setPasswordVerified(false);
        } finally {
            setVerifyingPassword(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword.length < 6) return toast.error('Minimum 6 characters');
        if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

        setLoadingField('password');
        try {
            await api.put('/api/profile/update-password', { currentPassword, newPassword });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordVerified(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoadingField(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => navigate('/chat')}
                        className="p-2 rounded-lg hover:bg-gray-800 transition"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-2xl font-semibold">Edit Profile</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT */}
                    <div className="space-y-6">
                        {/* Profile Picture */}
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="flex items-center gap-2 mb-4 font-medium">
                                <Camera size={18} /> Profile Picture
                            </h3>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-28 h-28 rounded-full bg-blue-600 overflow-hidden flex items-center justify-center text-3xl font-bold">
                                    {getProfileImage() ? (
                                        <img src={getProfileImage()} alt="profile" className="w-full h-full object-cover" />
                                    ) : (
                                        contextUser?.Username?.[0]?.toUpperCase() || 'U'
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
                                    disabled={loadingField === 'picture'}
                                    onClick={() => profileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                                >
                                    {loadingField === 'picture' ? <Spinner size="sm" /> : <Camera size={16} />}
                                    {loadingField === 'picture' ? 'Uploading...' : 'Change Picture'}
                                </button>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="flex items-center gap-2 mb-1 font-medium">
                                <User size={18} /> Username
                            </h3>
                            <p className="text-sm text-gray-400 mb-3">
                                Current: <span className="text-white">{contextUser?.Username}</span>
                            </p>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="New username"
                                className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-3 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleUpdateUsername}
                                disabled={loadingField === 'username'}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loadingField === 'username' ? <Spinner size="sm" /> : null}
                                {loadingField === 'username' ? 'Updating...' : 'Update Username'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="space-y-6">
                        {/* Email */}
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="flex items-center gap-2 mb-3 font-medium">
                                <Mail size={18} /> Change Email
                            </h3>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="New email address"
                                className="w-full bg-gray-800 rounded-lg px-4 py-2 mb-3 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleChangeEmail}
                                disabled={loadingField === 'email'}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loadingField === 'email' ? <Spinner size="sm" /> : null}
                                {loadingField === 'email' ? 'Sending...' : 'Send Verification Email'}
                            </button>
                        </div>

                        {/* Password */}
                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                            <h3 className="flex items-center gap-2 mb-4 font-medium">
                                <Lock size={18} /> Change Password
                            </h3>

                            {/* Current password */}
                            <div className="relative mb-3">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        setPasswordVerified(false);
                                    }}
                                    placeholder="Current password"
                                    className="w-full bg-gray-800 rounded-lg px-4 py-2 pr-10 outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400"
                                >
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <button
                                onClick={handleVerifyPassword}
                                disabled={verifyingPassword || passwordVerified}
                                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg mb-4 transition disabled:opacity-60 ${
                                    passwordVerified ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {verifyingPassword ? <Spinner size="sm" /> : passwordVerified ? <Check size={16} /> : null}
                                {verifyingPassword ? 'Verifying...' : passwordVerified ? 'Verified' : 'Verify Password'}
                            </button>

                            {/* New password */}
                            <div className="relative mb-3">
                                <input
                                    disabled={!passwordVerified}
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New password"
                                    className="w-full bg-gray-800 rounded-lg px-4 py-2 pr-10 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                                />
                                <button
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Confirm password */}
                            <div className="relative mb-4">
                                <input
                                    disabled={!passwordVerified}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full bg-gray-800 rounded-lg px-4 py-2 pr-10 outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40"
                                />
                                <button
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <button
                                disabled={!passwordVerified || loadingField === 'password'}
                                onClick={handleUpdatePassword}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loadingField === 'password' ? <Spinner size="sm" /> : null}
                                {loadingField === 'password' ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/chat')}
                    className="mt-8 w-full bg-gray-800 py-2.5 rounded-xl hover:bg-gray-700 transition text-sm"
                >
                    ← Back to Chat
                </button>
            </div>
        </div>
    );
};

export default EditProfile;