import { useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import apiauth from "../apiauth";
import "react-toastify/dist/ReactToastify.css";

const Register = () => {
    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [role, setrole] = useState("");
    const [Email, setemail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleregister = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(Email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        // Domain validation - only allow Gmail, Yahoo, Outlook
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
        const emailDomain = Email.toLowerCase().split('@')[1];
        if (!allowedDomains.includes(emailDomain)) {
            toast.error('Please use Gmail, Yahoo, or Outlook email');
            return;
        }

        if (Username === "" || Password === "") {
            toast.error("Username and Password cannot be empty");
            return;
        }

        setIsSubmitting(true) // disabling the button

        try {
            const res = await apiauth.post('/register', { Username, Password, Email, role });

            toast.success(res.data.message || `User: ${Username} created`);

            setTimeout(() => {
                navigate("/");
            }, 2000);
        }
        catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="App-div">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <MessageCircle style={{ color: 'var(--primary)' }} size={28} />
                <span style={{ color: 'var(--primary)' }}>Chatify</span>
            </h1>
            <h2 style={{ marginTop: '1rem' }}>Register</h2>

            <form onSubmit={handleregister}>
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
                    <b>Email:</b>
                    <input
                        type="email"
                        name="Email"
                        placeholder="example@gmail.com"
                        value={Email}
                        onChange={(e) => setemail(e.target.value)}
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

                <label>
                    <b>Role:</b>
                    <select name="role" onChange={(e) => { setrole(e.target.value); }}>
                        <option className="option" value="">User (default)</option>
                    </select>
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Registering" : "Register"}
                </button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Register;