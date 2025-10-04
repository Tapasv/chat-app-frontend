import { useState, createContext, useEffect } from "react";
import axios from "axios";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export const Authcntxt = createContext();

export const Authprovider = ({ children }) => {
    const [user, setuser] = useState(null);
    const [accessToken, setaccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const validateToken = async () => {
        const token = localStorage.getItem("accessToken");
        const savedUser = localStorage.getItem("user");
        
        if (!token || !savedUser) {
            setIsLoading(false);
            return false;
        }

        try {
            const response = await axios.get(`${SERVER_URL}/api/auth/validate`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.valid) {
                setuser(JSON.parse(savedUser));
                setaccessToken(token);
                setIsLoading(false);
                return true;
            } else {
                // Token validation returned false - clear everything
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                localStorage.removeItem("refreshToken");
                setuser(null);
                setaccessToken(null);
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            // Token is invalid or expired - clear everything
            console.log("Token validation failed:", error.message);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            localStorage.removeItem("refreshToken");
            setuser(null);
            setaccessToken(null);
            setIsLoading(false);
            return false;
        }
    };

    useEffect(() => {
        validateToken();
    }, []);

    const login = (saveduser, token, refreshToken) => {
        setuser(saveduser);
        setaccessToken(token);
        localStorage.setItem('user', JSON.stringify(saveduser));
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                await axios.post(`${SERVER_URL}/api/auth/logout`, { refreshToken });
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
        
        setuser(null);
        setaccessToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    };

    return (
        <Authcntxt.Provider value={{ login, logout, user, accessToken, isLoading }}>
            {children}
        </Authcntxt.Provider>
    );
};