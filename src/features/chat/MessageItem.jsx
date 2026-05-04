import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Play, Pause, Mic, MoreVertical } from 'lucide-react';
import { chatApi } from '../../lib/api/chat.api';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

// BUG FIX: Detect voice messages robustly.
// Backend sets isVoiceMessage:true, but also check URL patterns as fallback
// since Cloudinary voice uploads go to a /voice/ or similar path.
const detectIsVoice = (message) => {
    if (message.isVoiceMessage === true) return true;
    if (message.fileUrl) {
        const url = message.fileUrl.toLowerCase();
        // Cloudinary audio uploads typically have these resource_type patterns
        // or you may store them under a /voice/ folder — adjust if needed
        if (url.includes('/voice/') || url.includes('resource_type=video')) return true;
        // Common audio extensions
        if (/\.(webm|ogg|mp3|wav|m4a|aac)(\?|$)/.test(url)) return true;
    }
    return false;
};

const MessageItem = ({ message, currentUser, onMessageUpdate, onMessageDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.text || '');
    const [showOptions, setShowOptions] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef(null);
    const optionsRef = useRef(null);
    const editInputRef = useRef(null);

    const isCurrentUser = message.sender?._id === currentUser?._id;
    const isVoice = detectIsVoice(message);
    // isFile only if there's a fileUrl AND it's not a voice message
    const isFile = !!message.fileUrl && !isVoice;

    useEffect(() => {
        const handler = (e) => {
            if (optionsRef.current && !optionsRef.current.contains(e.target)) setShowOptions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (isEditing) editInputRef.current?.focus();
    }, [isEditing]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const canEdit = () => message.createdAt && Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000;
    const canDeleteForEveryone = () => message.createdAt && Date.now() - new Date(message.createdAt).getTime() < 48 * 60 * 60 * 1000;

    const handleEdit = async () => {
        if (!editContent.trim()) return toast.error('Message cannot be empty');
        try {
            const data = await chatApi.editMessage(message._id, editContent);
            onMessageUpdate(data);
            setIsEditing(false);
        } catch { toast.error('Failed to edit message'); }
    };

    const handleDeleteConfirm = async () => {
        try {
            const data = await chatApi.deleteMessage(message._id, deleteType);
            deleteType === 'forMe' ? onMessageDelete(message._id) : onMessageUpdate(data);
            setShowDeleteModal(false);
            setDeleteType(null);
        } catch { toast.error('Failed to delete message'); }
    };

    // Build the correct audio URL — Cloudinary gives full https:// URLs,
    // local uploads need SERVER_URL prefix
    const getAudioUrl = () => {
        if (!message.fileUrl) return '';
        if (message.fileUrl.startsWith('http')) return message.fileUrl;
        // Normalize Windows backslashes to forward slashes, ensure leading /
        const normalized = message.fileUrl.replace(/\\/g, '/');
        const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
        return `${SERVER_URL}${withSlash}`;
    };

    const togglePlayback = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(getAudioUrl());
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current.duration);
            });
            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current.currentTime);
            });
            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
            });
        }
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const formatTime = (t) => {
        if (!t || isNaN(t)) return '0:00';
        return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    };

    const msgTime = new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (message.deletedForEveryone) {
        return (
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} py-0.5`}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-elevated border border-border">
                    <svg width="12" height="12" fill="none" stroke="#4a5568" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-xs text-text-muted italic">Message deleted</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} py-0.5 group`}>
                <div ref={optionsRef} className="relative max-w-[68%]">

                    {/* Options button */}
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className={`absolute top-1 ${isCurrentUser ? '-left-7' : '-right-7'} p-1 rounded-md bg-elevated border border-border opacity-0 group-hover:opacity-100 transition-opacity z-10`}
                    >
                        <MoreVertical size={12} className="text-text-secondary" />
                    </button>

                    {/* Dropdown */}
                    {showOptions && (
                        <div className={`absolute ${isCurrentUser ? 'right-0' : 'left-0'} top-8 w-44 bg-elevated border border-border rounded-md shadow-xl z-50 overflow-hidden py-1`}>
                            {isCurrentUser && !isFile && !isVoice && canEdit() && (
                                <button
                                    onClick={() => { setIsEditing(true); setShowOptions(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-overlay transition-colors flex items-center gap-2"
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                    </svg>
                                    Edit message
                                </button>
                            )}
                            {isCurrentUser && canDeleteForEveryone() && (
                                <button
                                    onClick={() => { setDeleteType('forEveryone'); setShowDeleteModal(true); setShowOptions(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-status-error hover:bg-status-error/10 transition-colors flex items-center gap-2"
                                >
                                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Delete for everyone
                                </button>
                            )}
                            <button
                                onClick={() => { setDeleteType('forMe'); setShowDeleteModal(true); setShowOptions(false); }}
                                className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-overlay transition-colors flex items-center gap-2"
                            >
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                                Delete for me
                            </button>
                        </div>
                    )}

                    {/* Edit mode */}
                    {isEditing ? (
                        <div className="bg-elevated border border-accent/40 rounded-md p-3 shadow-lg min-w-[240px]">
                            <input
                                ref={editInputRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                                className="w-full bg-overlay rounded-sm px-2.5 py-1.5 text-sm text-text-primary outline-none border border-border focus:border-accent"
                            />
                            <div className="flex gap-2 mt-2 justify-end">
                                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs rounded-sm bg-overlay text-text-secondary hover:text-text-primary transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleEdit} className="px-3 py-1 text-xs rounded-sm bg-accent hover:bg-accent-hover text-white transition-colors">
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-lg px-3.5 py-2.5 text-sm shadow-sm ${isCurrentUser
                                ? 'bg-accent text-white rounded-br-sm'
                                : 'bg-elevated border border-border text-text-primary rounded-bl-sm'
                            }`}>

                            {/* Text message */}
                            {!isFile && !isVoice && (
                                <p className="leading-relaxed break-words">{message.text}</p>
                            )}

                            {/* Voice message — inline player, never a link */}
                            {isVoice && (
                                <div className="flex items-center gap-2.5 min-w-[200px]">
                                    <button
                                        onClick={togglePlayback}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isCurrentUser ? 'bg-white/20 hover:bg-white/30' : 'bg-accent/20 hover:bg-accent/30'
                                            }`}
                                    >
                                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    </button>
                                    <div className="flex-1">
                                        <div className={`h-1 rounded-full ${isCurrentUser ? 'bg-white/20' : 'bg-border'}`}>
                                            <div
                                                className={`h-1 rounded-full transition-all ${isCurrentUser ? 'bg-white' : 'bg-accent'}`}
                                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] opacity-70 mt-0.5 block">
                                            {formatTime(isPlaying ? currentTime : duration)}
                                        </span>
                                    </div>
                                    <Mic size={12} className="opacity-50 flex-shrink-0" />
                                </div>
                            )}

                            {/* Non-voice file attachment */}
                            {isFile && (
                                <button
                                    onClick={() => window.open(message.fileUrl?.startsWith('http') ? message.fileUrl : `${SERVER_URL}${message.fileUrl}`, '_blank')}
                                    className={`flex items-center gap-2 text-sm hover:opacity-80 transition-opacity ${isCurrentUser ? 'text-white' : 'text-accent'}`}
                                >
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                    </svg>
                                    <span className="truncate max-w-[160px]">{message.fileName}</span>
                                </button>
                            )}

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 mt-1 justify-end">
                                <span className={`text-[10px] ${isCurrentUser ? 'text-white/60' : 'text-text-muted'}`}>
                                    {msgTime}
                                    {message.isEdited && ' · edited'}
                                </span>
                                {isCurrentUser && (
                                    <span className="flex-shrink-0">
                                        {message.readAt ? (
                                            // Double tick — read (both ticks colored)
                                            <svg width="14" height="10" viewBox="0 0 16 10" fill="none">
                                                <path d="M1 5L5 9L11 1" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M5 5L9 9L15 1" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            // Single tick — delivered (one tick, dimmer)
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <path d="M1 5L4 8L9 1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elevated border border-border rounded-lg p-5 w-full max-w-xs shadow-2xl">
                        <h3 className="font-semibold text-text-primary mb-1">Delete message</h3>
                        <p className="text-sm text-text-secondary mb-5">
                            {deleteType === 'forEveryone'
                                ? 'This message will be permanently deleted for everyone in this conversation.'
                                : 'This message will only be removed from your view.'}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 rounded-md bg-overlay text-text-secondary hover:text-text-primary text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 py-2 rounded-md bg-status-error/90 hover:bg-status-error text-white text-sm transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MessageItem;