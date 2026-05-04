import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { Authprovider, Authcntxt } from './context/authcontext';
import { Toaster } from 'sonner';

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
            <div className="flex items-center justify-center min-h-screen bg-base">
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
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Authprovider>
                <AppContent />
                <Toaster
                    position="top-right"
                    theme="dark"
                    richColors
                    closeButton
                    toastOptions={{
                        style: {
                            background: '#1c2333',
                            border: '1px solid #2a3348',
                            color: '#f1f5f9',
                            fontSize: '13px',
                        },
                    }}
                />
            </Authprovider>
        </BrowserRouter>
    );
}

export default App;