import { Authcntxt } from "../context/authcontext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
    const { logout, user } = useContext(Authcntxt);
    const navigate = useNavigate();

    return (
        <nav>
            {user ? (
                <div className="Welcome">
                    <h1 style={{ margin: 0 }}>
                        💬 Welcome, <span style={{ color: 'var(--primary)' }}>{user.Username}</span>
                    </h1>
                    <button
                        type="button"
                        onClick={() => {
                            logout();
                            if (user.role === "Admin") {
                                navigate("/admin");
                            } else {
                                navigate("/chat");
                            }
                        }}
                    >
                        Logout
                    </button>
                    <h1 className="chat-hdng" style={{ margin: 0 }}>
                        {user.role === "Admin" ? "⚙️ Admin Panel" : "🚀 Chatify"}
                    </h1>
                </div>
            ) : (
                <div className="Link" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
                        💬 <span style={{ color: 'var(--primary)' }}>Chatify</span>
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
                                Register
                            </button>
                        </Link>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/login">
                            <button type="button">Login</button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;