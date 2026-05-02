import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Authcntxt } from '../../context/authcontext';
import { useSocket } from '../../hooks/useSocket';
import { useChat } from '../../hooks/useChat';
import { useFriends } from '../../hooks/useFriends';
import { chatApi } from '../../lib/api/chat.api';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import ErrorBoundary from '../../components/ui/ErrorBoundary';

const Chat = () => {
    const { logout } = useContext(Authcntxt);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    const [activeUser, setActiveUser] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});

    // Keep a ref to activeUser so the socket listener always sees the latest value
    // without needing to re-register on every activeUser change
    const activeUserRef = useRef(null);
    const currentUserRef = useRef(currentUser);

    const socketRef = useSocket(currentUser);

    // Load blocked users on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await chatApi.getBlockedUsers();
                setBlockedUsers(Array.isArray(data) ? data : []);
            } catch {
                setBlockedUsers([]);
            }
        };
        load();
    }, []);

    // Keep activeUserRef in sync — no listener re-registration needed
    useEffect(() => {
        activeUserRef.current = activeUser;
    }, [activeUser]);

    // Register unread listener ONCE after socket is ready.
    // Uses refs so it never needs to be re-registered when activeUser changes.
    // BUG FIX: Previously this was inside a setInterval that re-ran on every
    // activeUser change but never cleaned up the old listener → stacking
    // listeners → word-count instead of message-count.
    useEffect(() => {
        let cleanup = null;

        const register = () => {
            const socket = socketRef.current;
            if (!socket) return false;

            const handleNewMessage = (data) => {
                const senderId = data.sender._id;
                const currentId = currentUserRef.current?._id;
                const activeId = activeUserRef.current?._id;

                // Only count if it's an incoming message from someone other than the active chat
                if (senderId !== currentId && senderId !== activeId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [senderId]: (prev[senderId] || 0) + 1
                    }));
                }
            };

            socket.on('receivePrivateMessage', handleNewMessage);
            cleanup = () => socket.off('receivePrivateMessage', handleNewMessage);
            return true;
        };

        // Poll until socket is ready, then register exactly once
        if (!register()) {
            const interval = setInterval(() => {
                if (register()) clearInterval(interval);
            }, 100);
            return () => {
                clearInterval(interval);
                cleanup?.();
            };
        }

        return () => cleanup?.();
    }, []); // Empty deps — intentional, refs handle dynamic values

    const { friends, pendingRequests, sentRequests, onlineUsers, sendRequest, acceptRequest, rejectRequest, unfriend } = useFriends(socketRef);
    const { messages, isLoading, typingUsers, addOptimisticMessage, updateMessage, deleteMessage } = useChat(activeUser, currentUser?._id, socketRef, blockedUsers);

    const handleSelectFriend = useCallback((friend) => {
        setActiveUser(friend);
        setShowSidebar(false);
        setUnreadCounts(prev => ({ ...prev, [friend._id]: 0 }));
        localStorage.setItem('activeUser', JSON.stringify(friend));
    }, []);

    const handleBack = useCallback(() => {
        setActiveUser(null);
        setShowSidebar(true);
        localStorage.removeItem('activeUser');
    }, []);

    const handleBlock = useCallback(async () => {
        if (!activeUserRef.current || !window.confirm(`Block ${activeUserRef.current.Username}?`)) return;
        try {
            await chatApi.blockUser(activeUserRef.current._id);
            setBlockedUsers(prev => [...prev, activeUserRef.current._id]);
            toast.success(`${activeUserRef.current.Username} blocked`);
        } catch { toast.error('Failed to block user'); }
    }, []);

    const handleUnblock = useCallback(async () => {
        if (!activeUserRef.current || !window.confirm(`Unblock ${activeUserRef.current.Username}?`)) return;
        try {
            await chatApi.unblockUser(activeUserRef.current._id);
            setBlockedUsers(prev => prev.filter(id => id !== activeUserRef.current._id));
            toast.success(`${activeUserRef.current.Username} unblocked`);
        } catch { toast.error('Failed to unblock user'); }
    }, []);

    const handleClearChat = useCallback(async () => {
        if (!activeUserRef.current || !window.confirm('Clear this chat?')) return;
        try {
            await chatApi.clearChat(activeUserRef.current._id);
            deleteMessage('__all__');
            toast.success('Chat cleared');
        } catch { toast.error('Failed to clear chat'); }
    }, [deleteMessage]);

    const handleLogout = useCallback(async () => {
        await logout();
        navigate('/login');
    }, [logout, navigate]);

    const handleUnfriend = useCallback((friendId) => {
        unfriend(friendId, activeUserRef.current?._id, handleBack);
    }, [unfriend, handleBack]);

    return (
        <div className="flex h-screen overflow-hidden text-white bg-gray-950">
            <ErrorBoundary>
                <ChatSidebar
                    currentUser={currentUser}
                    friends={friends}
                    onlineUsers={onlineUsers}
                    blockedUsers={blockedUsers}
                    pendingRequests={pendingRequests}
                    sentRequests={sentRequests}
                    activeUser={activeUser}
                    showSidebar={showSidebar}
                    unreadCounts={unreadCounts}
                    onSelectFriend={handleSelectFriend}
                    onSendRequest={sendRequest}
                    onAcceptRequest={acceptRequest}
                    onRejectRequest={rejectRequest}
                    onUnfriend={handleUnfriend}
                    onLogout={handleLogout}
                />
            </ErrorBoundary>

            <div className="flex-1 flex flex-col min-w-0">
                {!activeUser ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-300 mb-1">Your Messages</h2>
                            <p className="text-sm">Select a friend to start chatting</p>
                        </div>
                    </div>
                ) : (
                    <ErrorBoundary>
                        <ChatHeader
                            activeUser={activeUser}
                            isOnline={onlineUsers.includes(activeUser._id)}
                            isBlocked={blockedUsers.includes(activeUser._id)}
                            onBack={handleBack}
                            onBlock={handleBlock}
                            onUnblock={handleUnblock}
                            onClearChat={handleClearChat}
                        />
                        <ChatWindow
                            messages={messages}
                            isLoading={isLoading}
                            typingUsers={typingUsers}
                            currentUser={currentUser}
                            onMessageUpdate={updateMessage}
                            onMessageDelete={deleteMessage}
                        />
                        <MessageInput
                            activeUser={activeUser}
                            currentUser={currentUser}
                            isBlocked={blockedUsers.includes(activeUser._id)}
                            socketRef={socketRef}
                            onOptimisticMessage={addOptimisticMessage}
                        />
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
};

export default Chat;