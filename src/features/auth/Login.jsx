import { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Authcntxt } from '../../context/authcontext';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../lib/api/auth.api';
import Spinner from '../../components/ui/Spinner';

const Login = () => {
    const [Username, setUsername] = useState('');
    const [Password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login, user } = useContext(Authcntxt);

    useEffect(() => {
        if (user) user.role === 'Admin' ? navigate('/admin') : navigate('/chat');
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const data = await authApi.login({ Username, Password });
            login(data.user, data.accessToken, data.refreshToken);
            toast.success(`Welcome back, ${data.user.Username}`);
            setTimeout(() => {
                data.user.role === 'Admin' ? navigate('/admin') : navigate('/chat');
            }, 800);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                        <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-text-primary">Sign in to Chatify</h1>
                    {/* <p className="text-text-secondary text-sm mt-1">Enterprise communication platform</p> */}
                </div>

                {/* Card */}
                <div className="bg-surface border border-border rounded-lg p-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
                            <input
                                type="text"
                                value={Username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                className="w-full bg-elevated border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={Password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full bg-elevated border border-border rounded-md px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                    ) : (
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    )}
                                </button>
                            </div>
                            <div className="flex justify-end mt-1.5">
                                <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-hover transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md text-sm transition-colors mt-2"
                        >
                            {isSubmitting ? <><Spinner size="sm" /> Signing in...</> : 'Sign in'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-text-secondary mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-accent hover:text-accent-hover transition-colors font-medium">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;