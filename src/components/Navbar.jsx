import { Authcntxt } from "../context/authcontext";
import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Settings, Rocket, UserPlus, LogIn } from "lucide-react";

const Navbar = () => {
    const { logout, user } = useContext(Authcntxt);
    const navigate = useNavigate();
    const location = useLocation(); // Get current route

    const handleLogout = async () => {
        // Save role BEFORE logout clears user
        const userRole = user?.role;

        await logout();

        // Navigate based on the saved role
        navigate('/login');
    };

    // Check if admin is on chat page
    const isAdminOnChat = user?.role === "Admin" && location.pathname === "/chat";

    return (
        <nav>
            {user ? (
                <div className="Welcome">
                    <h1 className="chat-hdng">
                        {user.role === "Admin" ? (
                            isAdminOnChat ? (
                                // Admin on Chat page - show Chatify
                                <><MessageCircle style={{ display: 'inline', marginRight: '0.3rem' }} size={28} /> <span style={{ color: 'var(--primary)' }}>Chatify</span></>
                            ) : (
                                // Admin on User Management page - show Admin Panel
                                <><Settings style={{ display: 'inline', marginRight: '0.3rem' }} size={24} /> Admin Panel</>
                            )
                        ) : (
                            // Regular user - always show Chatify
                            <><MessageCircle style={{ display: 'inline', marginRight: '0.3rem' }} size={28} /> <span style={{ color: 'var(--primary)' }}>Chatify</span></>
                        )}
                    </h1>
                </div>
            ) : (
                <div className="Link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
                        <MessageCircle style={{ display: 'inline', marginRight: '0.3rem' }} size={28} /> <span style={{ color: 'var(--primary)' }}>Chatify</span>
                    </h1>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        fontSize: '1rem',
                        color: 'rgba(255, 255, 255, 0.85)'
                    }}>
                        <span>First time on Chatify?</span>
                        <Link to="/register">
                            <button type="button" style={{
                                padding: '0.5rem 1.2rem',
                                fontSize: '0.95rem',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}>
                                <UserPlus style={{ display: 'inline', marginRight: '0.3rem' }} size={16} /> Register
                            </button>
                        </Link>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/login">
                            <button type="button"><LogIn style={{ display: 'inline', marginRight: '0.3rem' }} size={16} /> Login</button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;