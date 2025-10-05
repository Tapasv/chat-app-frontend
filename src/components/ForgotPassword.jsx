import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"
import apiauth from "../apiauth";

const ForgotPassword = () => {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if(!email.trim()) {
            toast.error("Please enter your email!");
            return
        }

        setLoading(true)

        try{
            const res = await apiauth.post('/forgot-password', { email })
            toast.success(res.data.message)
            setEmail("")
        } catch(err) {
            toast.error(err.response?.data?.message || "Failed to send reset link!")
        } finally{
            setLoading(false)
        }
    }

    return (
        <div className="Login-div">
            <h1>Forgot Password</h1>
            <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
                Enter your email to receive a password reset link
            </p>
            
            <form onSubmit={handleSubmit}>
                <label>
                    <b>Email:</b>
                    <input 
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
            <ToastContainer />
        </div>
    );
}

export default ForgotPassword