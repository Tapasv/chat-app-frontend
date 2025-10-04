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
                    <h1 style={{margin: 0}}>
                        💬 Welcome, <span style={{color: 'var(--primary)'}}>{user.Username}</span>
                    </h1>
                    <button 
                        type="button" 
                        onClick={() => {
                            logout(); 
                            navigate('/');
                        }}
                    >
                        Logout
                    </button>
                    <h1 className="chat-hdng" style={{margin: 0}}>
                        {user.role === "Admin" ? "⚙️ Admin Panel" : "🚀 Chatify"}
                    </h1>
                </div>
            ) : (
                <div className="Link">
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
                        <h1 style={{margin: 0, fontSize: '1.8rem'}}>
                            💬 <span style={{color: 'var(--primary)'}}>Chatify</span>
                        </h1>
                        <p style={{
                            margin: 0, 
                            fontSize: '0.9rem', 
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontWeight: '300',
                            letterSpacing: '0.5px'
                        }}>
                            First time on Chatify? Click <span style={{color: 'var(--primary)', fontWeight: '500'}}>Register</span>
                        </p>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <Link to="/login">
                            <button type="button">Login</button>
                        </Link>
                        <Link to="/register">
                            <button type="button">Register</button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;