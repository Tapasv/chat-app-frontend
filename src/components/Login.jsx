import { useState, useContext, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import apiauth from "../apiauth";
import { Authcntxt } from "../context/authcontext";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

const Login = () => {
    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const navigate = useNavigate();
    const { login, user } = useContext(Authcntxt);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === "Admin") {
                navigate('/admin');
            } else {
                navigate('/chat');
            }
        }
    }, [user, navigate]);

    const handlelogin = async (e) => {
        e.preventDefault();

        if (isSubmitting) return

        setIsSubmitting(true)

        try {
            const res = await apiauth.post('/login', { Username, Password });
            const { user, token, refreshToken } = res.data;

            login(user, token, refreshToken);

            toast.success(res.data.message || `Welcome back, ${Username}!`);

            setTimeout(() => {
                if (user.role === "Admin") {
                    navigate("/admin");
                } else {
                    navigate("/chat");
                }
            }, 2000);
        }
        catch (err) {
            toast.error(err.response?.data?.message || `Invalid credentials`);
            console.error(err);
            setIsSubmitting(false)
        }
    };

    return (
        <div className="Login-div">
            <h1>🔐 Login</h1>
            <form action="" onSubmit={handlelogin}>
                <label>
                    <b>Username:</b>
                    <input
                        type="text"
                        name="Username"
                        placeholder="Enter Username"
                        value={Username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>

                <label>
                    <b>Password:</b>
                    <input
                        type="password"
                        name="Password"
                        placeholder="Enter Password"
                        value={Password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>

                <div style={{ textAlign: 'right', marginTop: '-1rem', marginBottom: '1rem' }}>
                    <Link to="/forgot-password" style={{ color: '#e50914', fontSize: '0.9rem' }}>
                        Forgot Password?
                    </Link>
                </div>

                <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging In" : "Login"}
                </button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Login;