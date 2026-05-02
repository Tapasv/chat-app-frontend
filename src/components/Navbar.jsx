import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Authcntxt } from '../context/authcontext';
import { LogOut, LogIn, UserPlus } from 'lucide-react';

const HIDDEN_ROUTES = ['/chat'];

const Navbar = () => {
    const { logout, user } = useContext(Authcntxt);
    const navigate = useNavigate();
    const location = useLocation();

    if (HIDDEN_ROUTES.includes(location.pathname)) return null;

    const handleLogout = async () => { await logout(); navigate('/login'); };

    return (
        <nav className="sticky top-0 z-50 bg-surface border-b border-border">
            <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <svg width="14" height="14" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-sm text-text-primary">Chatify</span>
                </Link>

                {user ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-sm bg-elevated border border-border text-text-secondary">
                            {user.role}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/20 transition-colors"
                        >
                            <LogOut size={13} /> Sign out
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link to="/login">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors">
                                <LogIn size={13} /> Sign in
                            </button>
                        </Link>
                        <Link to="/register">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent hover:bg-accent-hover text-white transition-colors">
                                <UserPlus size={13} /> Register
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;