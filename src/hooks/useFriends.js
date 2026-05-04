import { useState, useEffect, useRef, useCallback } from 'react';
import { friendApi } from '../lib/api/friend.api';
import { toast } from 'sonner';

export const useFriends = (socketRef) => {
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const listenersAttached = useRef(false);

    // Parallel load — all 3 requests fire simultaneously
    useEffect(() => {
        const loadData = async () => {
            try {
                const [friendsData, received, sent] = await Promise.all([
                    friendApi.getFriendList(),
                    friendApi.getReceivedRequests(),
                    friendApi.getSentRequests()
                ]);
                setFriends(Array.isArray(friendsData) ? friendsData : []);
                setPendingRequests(Array.isArray(received) ? received : []);
                setSentRequests(Array.isArray(sent) ? sent : []);
            } catch {
                setFriends([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Attach socket listeners — poll until socket is ready, then attach once
    useEffect(() => {
        let cleanup = null;

        const attach = () => {
            const socket = socketRef.current;
            if (!socket || listenersAttached.current) return false;

            listenersAttached.current = true;

            const handleOnlineUsers = (users) => setOnlineUsers(users);

            const handleRequestReceived = (request) => {
                setPendingRequests(prev => [...prev, request]);
                toast.info(`${request.sender.Username} sent you a friend request!`);
            };

            const handleRequestAccepted = (friend) => {
                setFriends(prev => {
                    const exists = prev.some(f => f._id === friend._id);
                    return exists ? prev : [...prev, friend];
                });
                setSentRequests(prev =>
                    prev.filter(r => r.receiver?._id !== friend._id)
                );
                toast.success(`${friend.Username} accepted your friend request!`);
            };

            const handleRequestRejected = ({ receiverId }) => {
                setSentRequests(prev =>
                    prev.filter(r => r.receiver?._id !== receiverId)
                );
            };

            const handleFriendRemoved = ({ userId }) => {
                setFriends(prev => prev.filter(f => f._id !== userId));
                toast.info('A friend removed you from their list');
            };

            socket.on('onlineUsers', handleOnlineUsers);
            socket.on('friendRequestReceived', handleRequestReceived);
            socket.on('friendRequestAccepted', handleRequestAccepted);
            socket.on('friendRequestRejected', handleRequestRejected);
            socket.on('friendRemoved', handleFriendRemoved);

            cleanup = () => {
                socket.off('onlineUsers', handleOnlineUsers);
                socket.off('friendRequestReceived', handleRequestReceived);
                socket.off('friendRequestAccepted', handleRequestAccepted);
                socket.off('friendRequestRejected', handleRequestRejected);
                socket.off('friendRemoved', handleFriendRemoved);
                listenersAttached.current = false;
            };

            return true;
        };

        // Try immediately; if socket not ready yet, poll every 100ms
        if (!attach()) {
            const interval = setInterval(() => {
                if (attach()) clearInterval(interval);
            }, 100);
            return () => {
                clearInterval(interval);
                cleanup?.();
            };
        }

        return () => cleanup?.();
    }, []);

    const sendRequest = useCallback(async (receiverId) => {
        try {
            await friendApi.sendRequest(receiverId);
            setSentRequests(prev => [...prev, { receiver: { _id: receiverId } }]);
            toast.success('Friend request sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send request');
        }
    }, []);

    const acceptRequest = useCallback(async (requestId, sender) => {
        try {
            await friendApi.acceptRequest(requestId);
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
            setFriends(prev => {
                const exists = prev.some(f => f._id === sender._id);
                return exists ? prev : [...prev, sender];
            });
            toast.success('Friend request accepted!');
        } catch {
            toast.error('Failed to accept request');
        }
    }, []);

    const rejectRequest = useCallback(async (requestId, senderId) => {
        try {
            await friendApi.rejectRequest(requestId);
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
            setSentRequests(prev =>
                prev.filter(r => r.receiver?._id !== senderId)
            );
        } catch {
            toast.error('Failed to reject request');
        }
    }, []);

    const unfriend = useCallback(async (friendId, activeUserId, onClearChat) => {
        if (!window.confirm('Remove this friend?')) return;
        try {
            await friendApi.unfriend(friendId);
            setFriends(prev => prev.filter(f => f._id !== friendId));
            if (activeUserId === friendId && onClearChat) onClearChat();
            toast.success('Friend removed');
        } catch {
            toast.error('Failed to remove friend');
        }
    }, []);

    return {
        friends,
        setFriends,
        pendingRequests,
        sentRequests,
        setSentRequests,
        onlineUsers,
        isLoading,
        sendRequest,
        acceptRequest,
        rejectRequest,
        unfriend
    };
};