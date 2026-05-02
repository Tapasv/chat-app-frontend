import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const useSocket = (user) => {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        socketRef.current = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 20000,
            auth: { Username: user.Username, userid: user._id }
        });

        socketRef.current.emit('requestOnlineUsers');

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?._id]);

    return socketRef;
};