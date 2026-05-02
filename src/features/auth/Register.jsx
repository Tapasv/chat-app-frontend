import { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Authcntxt } from '../../context/authcontext';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../lib/api/auth.api';
import Spinner from '../../components/ui/Spinner';

const Register = () => {
    const [form, setForm] = useState({ Username: '', Email: '', Password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useContext(Authcntxt);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/chat');
    }, [user, navigate]);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await authApi.register(form);
            toast.success('Account created! Please sign in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-base flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 mb-4">
                        <svg width="22" height="22" fill="none" stroke="#6366f1" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-text-primary">Create your account</h1>
                    <p className="text-text-secondary text-sm mt-1">Join Chatify today</p>
                </div>

                <div className="bg-surface border border-border rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {[
                            { name: 'Username', label: 'Username', type: 'text', placeholder: 'Choose a username' },
                            { name: 'Email', label: 'Email address', type: 'email', placeholder: 'you@example.com' },
                            { name: 'Password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' }
                        ].map(field => (
                            <div key={field.name}>
                                <label className="block text-xs font-medium text-text-secondary mb-1.5">{field.label}</label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    required
                                    className="w-full bg-elevated border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                                />
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md text-sm transition-colors mt-2"
                        >
                            {isSubmitting ? <><Spinner size="sm" /> Creating account...</> : 'Create account'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-text-secondary mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;