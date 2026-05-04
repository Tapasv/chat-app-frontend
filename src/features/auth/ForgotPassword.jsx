import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { authApi } from '../../lib/api/auth.api';
import Spinner from '../../components/ui/Spinner';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return toast.error('Please enter your email');

        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            setSent(true);
            toast.success('Reset link sent if that email exists');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                        <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-text-primary">Reset your password</h1>
                    <p className="text-text-secondary text-sm mt-1">Enter your email to receive a reset link</p>
                </div>

                <div className="bg-surface border border-border rounded-lg p-6">
                    {sent ? (
                        <div className="text-center py-2">
                            <div className="w-10 h-10 rounded-full bg-status-success/10 border border-status-success/20 flex items-center justify-center mx-auto mb-3">
                                <svg width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-text-primary mb-1">Check your inbox</p>
                            <p className="text-xs text-text-secondary">If an account exists for {email}, you'll receive a reset link shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-elevated border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium py-2.5 rounded-md text-sm transition-colors"
                            >
                                {loading ? <><Spinner size="sm" /> Sending...</> : 'Send reset link'}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-xs text-text-secondary mt-4">
                    Remember your password?{' '}
                    <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;