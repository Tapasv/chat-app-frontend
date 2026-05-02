import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { Authprovider, Authcntxt } from './context/authcontext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import Chat from './features/chat/Chat';
import EditProfile from './features/profile/EditProfile';
import VerifyEmail from './features/profile/VerifyEmail';
import Adminpanel from './components/Adminpanel';
import Navbar from './components/Navbar';
import Spinner from './components/ui/Spinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

function AppContent() {
    const { isLoading } = useContext(Authcntxt);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="App-div">
            <Navbar />
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/admin" element={<Adminpanel />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/edit-profile" element={<EditProfile />} />
                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                </Routes>
            </ErrorBoundary>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Authprovider>
                <AppContent />
            </Authprovider>
        </BrowserRouter>
    );
}

export default App;