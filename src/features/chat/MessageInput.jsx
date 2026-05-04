import { useState, useRef, useEffect } from 'react';
import { Mic, Send, Paperclip, Smile, Square } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const MessageInput = ({ activeUser, currentUser, isBlocked, socketRef, onOptimisticMessage }) => {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const emitTyping = (typing) => {
        if (!socketRef.current || !activeUser) return;
        socketRef.current.emit(typing ? 'TypingPrivate' : 'StopTypingPrivate', {
            username: currentUser.Username,
            receiver: activeUser._id
        });
    };

    const handleInput = (e) => {
        setMessage(e.target.value);
        emitTyping(e.target.value.length > 0);
    };

    const handleSend = () => {
        const text = message.trim();
        if (!text || !socketRef.current || !activeUser) return;

        // Optimistic update — show message instantly without waiting for server echo
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const optimisticMsg = {
            _id: tempId,
            text,
            sender: { _id: currentUser._id, Username: currentUser.Username },
            receiver: { _id: activeUser._id },
            createdAt: new Date().toISOString(),
            isOptimistic: true,  // flag so dedup works in useChat
        };
        onOptimisticMessage?.(optimisticMsg);

        socketRef.current.emit('sendPrivateMessage', {
            sender: currentUser._id,
            receiver: activeUser._id,
            text,
            tempId,  // send tempId so server can echo it back for dedup
        });

        emitTyping(false);
        setMessage('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const uploadFile = (blob, filename, isVoice = false) => {
        if (!activeUser) return;
        const formData = new FormData();
        formData.append('file', blob, filename);
        formData.append('receiver', activeUser._id);
        if (isVoice) formData.append('isVoiceMessage', 'true');

        setIsUploading(true);
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            setIsUploading(false);
            xhr.status === 200
                ? toast.success(isVoice ? 'Voice message sent' : 'File sent')
                : toast.error('Upload failed');
        });
        xhr.addEventListener('error', () => { setIsUploading(false); toast.error('Upload failed'); });
        xhr.open('POST', `${SERVER_URL}/api/chat/upload`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('accessToken')}`);
        xhr.send(formData);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) return toast.error('File must be under 100MB');
        uploadFile(file, file.name);
        e.target.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                uploadFile(new Blob(audioChunksRef.current, { type: 'audio/webm' }), `voice-${Date.now()}.webm`, true);
                stream.getTracks().forEach(t => t.stop());
                clearInterval(recordingIntervalRef.current);
                setRecordingDuration(0);
            };
            recorder.start();
            setIsRecording(true);
            recordingIntervalRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
        } catch { toast.error('Could not access microphone'); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    if (isBlocked) {
        return (
            <div className="h-14 flex items-center justify-center border-t border-border bg-surface">
                <p className="text-xs text-text-secondary">You blocked this user — <button className="text-accent hover:text-accent-hover transition-colors">Unblock</button> to send messages</p>
            </div>
        );
    }

    return (
        <div className="border-t border-border bg-surface px-4 py-3 flex-shrink-0">
            {isRecording && (
                <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="w-2 h-2 rounded-full bg-status-error animate-pulse" />
                    <span className="text-xs text-status-error font-medium">Recording {formatDuration(recordingDuration)}</span>
                </div>
            )}

            <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isRecording}
                    className="p-2 rounded-md hover:bg-elevated text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors flex-shrink-0"
                    title="Attach file"
                >
                    <Paperclip size={16} />
                </button>

                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={isUploading ? 'Uploading...' : 'Write a message...'}
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        disabled={isUploading || isRecording}
                        className="w-full bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 disabled:opacity-50 transition-colors"
                    />
                </div>

                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        disabled={isRecording}
                        className="p-2 rounded-md hover:bg-elevated text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors"
                        title="Emoji"
                    >
                        <Smile size={16} />
                    </button>
                    {showEmoji && (
                        <div ref={emojiRef} className="absolute bottom-full right-0 mb-2 z-50">
                            <EmojiPicker
                                onEmojiClick={(e) => { setMessage(p => p + e.emoji); inputRef.current?.focus(); }}
                                width={300}
                                height={350}
                                theme="dark"
                                searchDisabled
                                skinTonesDisabled
                                previewConfig={{ showPreview: false }}
                            />
                        </div>
                    )}
                </div>

                {message.trim() ? (
                    <button
                        onClick={handleSend}
                        disabled={isUploading}
                        className="p-2 bg-accent hover:bg-accent-hover disabled:opacity-40 rounded-md text-white transition-colors flex-shrink-0"
                        title="Send"
                    >
                        <Send size={15} />
                    </button>
                ) : (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isUploading}
                        className={`p-2 rounded-md disabled:opacity-30 transition-colors flex-shrink-0 ${isRecording
                            ? 'bg-status-error/10 text-status-error border border-status-error/30'
                            : 'hover:bg-elevated text-text-muted hover:text-text-secondary'
                            }`}
                        title={isRecording ? 'Stop recording' : 'Voice message'}
                    >
                        {isRecording ? <Square size={15} /> : <Mic size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MessageInput;