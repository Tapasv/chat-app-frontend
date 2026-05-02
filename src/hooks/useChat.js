import { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi } from '../lib/api/chat.api';

export const useChat = (activeUser, currentUserId, socketRef, blockedUsers) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const activeUserRef = useRef(null);
    const listenersAttached = useRef(false);

    useEffect(() => {
        if (!activeUser) {
            setMessages([]);
            setTypingUsers([]);
            return;
        }
        if (activeUserRef.current === activeUser._id) return;
        activeUserRef.current = activeUser._id;

        const loadMessages = async () => {
            setIsLoading(true);
            setMessages([]);
            try {
                const data = await chatApi.getConversation(activeUser._id);
                if (activeUserRef.current === activeUser._id) {
                    setMessages(Array.isArray(data) ? data : []);
                }
            } catch {
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [activeUser?._id]);

    useEffect(() => {
        if (!activeUser) activeUserRef.current = null;
    }, [activeUser]);

    const activeUserIdRef = useRef(activeUser?._id);
    const blockedUsersRef = useRef(blockedUsers);
    const currentUserIdRef = useRef(currentUserId);

    useEffect(() => { activeUserIdRef.current = activeUser?._id; }, [activeUser?._id]);
    useEffect(() => { blockedUsersRef.current = blockedUsers; }, [blockedUsers]);
    useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

    useEffect(() => {
        let cleanup = null;

        const attach = () => {
            const socket = socketRef.current;
            if (!socket || listenersAttached.current) return false;
            listenersAttached.current = true;

            const handleReceiveMessage = (data) => {
                if (blockedUsersRef.current?.includes(data.sender._id)) return;

                const activeId = activeUserIdRef.current;
                const currentId = currentUserIdRef.current;

                const isRelevant =
                    (data.sender._id === activeId && data.receiver._id === currentId) ||
                    (data.sender._id === currentId && data.receiver._id === activeId);

                if (!isRelevant) return;

                setMessages(prev => {
                    // Dedup by real _id
                    if (prev.some(m => m._id === data._id)) return prev;

                    // Replace optimistic message by tempId if server echoes it back
                    if (data.tempId) {
                        const idx = prev.findIndex(m => m._id === data.tempId);
                        if (idx !== -1) {
                            const next = [...prev];
                            next[idx] = data;
                            return next;
                        }
                    }

                    // For sender's own messages: replace any optimistic temp message
                    // that matches by text + sender (fallback if tempId not returned by server)
                    if (data.sender._id === currentId) {
                        const idx = prev.findIndex(
                            m => m.isOptimistic && m.text === data.text && m.sender._id === currentId
                        );
                        if (idx !== -1) {
                            const next = [...prev];
                            next[idx] = data;
                            return next;
                        }
                    }

                    return [...prev, data];
                });
            };

            const handleMessageEdited = ({ messageId, text, isEdited }) => {
                setMessages(prev =>
                    prev.map(m => m._id === messageId ? { ...m, text, isEdited } : m)
                );
            };

            const handleMessageDeleted = ({ messageId, deletedForEveryone }) => {
                if (deletedForEveryone) {
                    setMessages(prev =>
                        prev.map(m => m._id === messageId
                            ? { ...m, deletedForEveryone: true, text: '' }
                            : m
                        )
                    );
                } else {
                    setMessages(prev => prev.filter(m => m._id !== messageId));
                }
            };

            const handleTyping = ({ username, senderId }) => {
                if (senderId === activeUserIdRef.current) {
                    setTypingUsers(prev =>
                        prev.includes(username) ? prev : [...prev, username]
                    );
                }
            };

            const handleStopTyping = ({ username }) => {
                setTypingUsers(prev => prev.filter(u => u !== username));
            };

            socket.on('receivePrivateMessage', handleReceiveMessage);
            socket.on('messageEdited', handleMessageEdited);
            socket.on('messageDeleted', handleMessageDeleted);
            socket.on('UserTypingPrivate', handleTyping);
            socket.on('UserStopTypingPrivate', handleStopTyping);

            cleanup = () => {
                socket.off('receivePrivateMessage', handleReceiveMessage);
                socket.off('messageEdited', handleMessageEdited);
                socket.off('messageDeleted', handleMessageDeleted);
                socket.off('UserTypingPrivate', handleTyping);
                socket.off('UserStopTypingPrivate', handleStopTyping);
                listenersAttached.current = false;
            };
            return true;
        };

        if (!attach()) {
            const interval = setInterval(() => {
                if (attach()) clearInterval(interval);
            }, 100);
            return () => { clearInterval(interval); cleanup?.(); };
        }

        return () => cleanup?.();
    }, []);

    // Called by MessageInput to instantly show message before server echo
    const addOptimisticMessage = useCallback((msg) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const updateMessage = useCallback((updatedMsg) => {
        setMessages(prev =>
            prev.map(m => m._id === updatedMsg._id ? updatedMsg : m)
        );
    }, []);

    const deleteMessage = useCallback((messageId) => {
        if (messageId === '__all__') { setMessages([]); return; }
        setMessages(prev => prev.filter(m => m._id !== messageId));
    }, []);

    return {
        messages,
        isLoading,
        typingUsers,
        setTypingUsers,
        addOptimisticMessage,
        updateMessage,
        deleteMessage
    };
};