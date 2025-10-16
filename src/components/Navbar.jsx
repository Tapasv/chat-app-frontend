import { Authcntxt } from "../context/authcontext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MessageCircle, LogOut, Settings, Rocket, UserPlus, LogIn } from "lucide-react";

const Navbar = () => {
    const { logout, user } = useContext(Authcntxt);
    const navigate = useNavigate();

    const handleLogout = async () => {
        // Save role BEFORE logout clears user
        const userRole = user?.role;

        await logout();

        // Navigate based on the saved role
        navigate('/login');
    };

    return (
        <nav>
            {user ? (
                <div className="Welcome">
                    {/* <h1 style={{ margin: 0 }}>
                        <MessageCircle style={{ display: 'inline', marginRight: '0.3rem' }} size={24} /> Welcome, <span style={{ color: 'var(--primary)' }}>{user.Username}</span>
                    </h1>
                    <button
                    className="lgt-btn"
                        type="button"
                        onClick={handleLogout}>
                        <LogOut style={{ display: 'inline', marginRight: '0.3rem' }} size={18} /> Logout
                    </button> */}
                    <h1 className="chat-hdng">
                        {user.role === "Admin" ? (
                            <><Settings style={{ display: 'inline', marginRight: '0.3rem' }} size={24} /> Admin Panel</>
                        ) : (
                            <><Rocket style={{ display: 'inline', marginRight: '0.3rem' }} size={24} /> Chatify</>
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