import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { SkeletonMessage } from '../../components/ui/Skeleton';

const TypingIndicator = ({ users }) => (
    <div className="flex items-center gap-2 px-4 py-1">
        <div className="flex gap-1 items-center bg-elevated border border-border rounded-full px-3 py-1.5">
            <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                    <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-text-secondary animate-bounce"
                        style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
                    />
                ))}
            </div>
            <span className="text-xs text-text-secondary ml-1">{users.join(', ')} typing</span>
        </div>
    </div>
);

const ChatWindow = ({ messages, isLoading, typingUsers, currentUser, onMessageUpdate, onMessageDelete }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, typingUsers.length]);

    if (isLoading) {
        return (
            <div className="flex-1 overflow-hidden px-0 py-2 space-y-1">
                {[...Array(6)].map((_, i) => <SkeletonMessage key={i} />)}
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-elevated border border-border flex items-center justify-center">
                        <svg width="20" height="20" fill="none" stroke="#8896b3" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-primary">No messages yet</p>
                        <p className="text-xs text-text-muted mt-0.5">Send a message to start the conversation</p>
                    </div>
                </div>
            ) : (
                messages.map((msg, index) => (
                    <MessageItem
                        key={msg._id || index}
                        message={msg}
                        currentUser={currentUser}
                        onMessageUpdate={onMessageUpdate}
                        onMessageDelete={onMessageDelete}
                    />
                ))
            )}

            {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatWindow;