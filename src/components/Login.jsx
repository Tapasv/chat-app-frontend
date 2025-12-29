import { useState, useContext, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiauth from "../apiauth";
import { LogIn } from "lucide-react";
import { Authcntxt } from "../context/authcontext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { login, user } = useContext(Authcntxt);

    useEffect(() => {
        if (user) {
            user.role === "Admin" ? navigate("/admin") : navigate("/chat");
        }
    }, [user, navigate]);

    const handlelogin = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await apiauth.post("/login", { Username, Password });
            const { user, token, refreshToken } = res.data;

            login(user, token, refreshToken);
            toast.success(res.data.message || `Welcome back, ${Username}!`);

            setTimeout(() => {
                user.role === "Admin" ? navigate("/admin") : navigate("/chat");
            }, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid credentials");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 px-4">
            <ToastContainer />

            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-black text-white p-3 rounded-full mb-3">
                        <LogIn size={26} />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-gray-500">
                        Login to continue to your account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handlelogin} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={Username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={Password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition"
                            required
                        />
                    </div>

                    {/* Forgot password */}
                    <div className="text-right">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-red-600 hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Don’t have an account?{" "}
                    <Link
                        to="/register"
                        className="text-black font-medium hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
