import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { Play, Pause, Mic } from 'lucide-react';
import apimessage from '../apimessage';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const MessageItem = ({ message, currentUser, onMessageUpdate, onMessageDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.text || '');
    const [showOptions, setShowOptions] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteType, setDeleteType] = useState(null);

    // Voice message states
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const optionsRef = useRef(null);
    const audioRef = useRef(null);

    const isCurrentUser = message.sender?._id === currentUser?._id;
    const isDeletedForEveryone = message.deletedForEveryone;
    const isFile = message.fileUrl;
    const isVoice = message.isVoiceMessage || (message.fileType && (message.fileType.includes('audio') || message.fileName?.includes('voice-')));

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };

        if (showOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showOptions]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const canEdit = () => {
        const messageTime = new Date(message.createdAt).getTime();
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000;
        return (now - messageTime) < fifteenMinutes;
    };

    const canDelete = () => {
        const messageTime = new Date(message.createdAt).getTime();
        const now = Date.now();
        const twoDays = 2 * 24 * 60 * 60 * 1000;
        return (now - messageTime) < twoDays;
    };

    const handleEdit = async () => {
        if (!editContent.trim()) {
            toast.error('Message cannot be empty');
            return;
        }

        try {
            const res = await apimessage.put(`/edit/${message._id}`, {
                text: editContent
            });

            toast.success('Message edited');
            setIsEditing(false);
            onMessageUpdate(res.data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to edit message');
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const res = await apimessage.delete(`/delete/${message._id}`, {
                data: { deleteType }
            });

            toast.success(res.data.message);
            setShowDeleteModal(false);
            setShowOptions(false);
            setDeleteType(null);

            if (deleteType === 'forMe') {
                onMessageDelete(message._id);
            } else {
                onMessageUpdate(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete message');
        }
    };

    // Voice message functions
    const togglePlayback = () => {
        if (!audioRef.current) {
            // Construct the proper audio URL
            const audioUrl = message.fileUrl.startsWith('http')
                ? message.fileUrl
                : `${SERVER_URL}${message.fileUrl}`;

            console.log('🎵 Loading audio from:', audioUrl);

            audioRef.current = new Audio(audioUrl);

            audioRef.current.addEventListener('loadedmetadata', () => {
                console.log('✅ Audio loaded, duration:', audioRef.current.duration);
                setDuration(audioRef.current.duration);
            });

            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current.currentTime);
            });

            audioRef.current.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
                audioRef.current.currentTime = 0;
            });

            audioRef.current.addEventListener('error', (e) => {
                console.error('❌ Audio error:', e);
                console.error('Audio URL:', audioUrl);
                toast.error('Failed to load audio');
                setIsPlaying(false);
            });
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                })
                .catch(err => {
                    console.error('❌ Play error:', err);
                    console.error('Audio src:', audioRef.current?.src);
                    toast.error('Failed to play audio');
                    setIsPlaying(false);
                });
        }
    };

    const formatAudioTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    if (isDeletedForEveryone) {
        return (
            <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
                <div className="message-bubble">
                    <div className="message-content deleted">
                        <i>🚫 This message was deleted</i>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
            <div className="message-wrapper">
                {/* Three-dot menu */}
                <div className="message-options" ref={optionsRef}>
                    <button
                        className="options-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOptions(!showOptions);
                        }}
                    >
                        ⋮
                    </button>

                    {showOptions && (
                        <div
                            className={`options-menu ${isCurrentUser ? 'menu-right' : 'menu-left'}`}>

                            {/* FOR SENDER: Show Edit and Delete for Everyone (within time limits) */}
                            {isCurrentUser && !isFile && canEdit() && (
                                <button onClick={() => {
                                    setIsEditing(true);
                                    setShowOptions(false);
                                }}>
                                    ✏️ Edit
                                </button>
                            )}

                            {isCurrentUser && canDelete() && (
                                <button onClick={() => {
                                    setDeleteType('forEveryone');
                                    setShowDeleteModal(true);
                                    setShowOptions(false);
                                }}>
                                    Delete for Everyone
                                </button>
                            )}

                            {/* FOR EVERYONE: Show Delete for Me (always available) */}
                            <button className='dlt-msg-btn' onClick={() => {
                                setDeleteType('forMe');
                                setShowDeleteModal(true);
                                setShowOptions(false);
                            }}>
                                Delete for Me
                            </button>
                        </div>
                    )}
                </div>

                {/* Message content */}
                {isEditing ? (
                    <div className="edit-mode">
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                        />
                        <button onClick={handleEdit}>Save</button>
                        <button onClick={() => {
                            setIsEditing(false);
                            setEditContent(message.text);
                        }}>Cancel</button>
                    </div>
                ) : (
                    <div className="message-bubble">
                        {isFile ? (
                            <div className="file-message">
                                {message.fileType?.startsWith('image/') ? (
                                    <div className="image-preview">
                                        <img
                                            src={`${SERVER_URL}${message.fileUrl}`}
                                            alt={message.fileName}
                                            style={{
                                                maxWidth: '200px',
                                                maxHeight: '200px',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => window.open(`${SERVER_URL}${message.fileUrl}`, '_blank')}
                                        />
                                    </div>
                                ) : isVoice ? (
                                    // Voice Message Player
                                    <div className="voice-message-player">
                                        <button
                                            onClick={togglePlayback}
                                            className="voice-play-button"
                                        >
                                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                        </button>

                                        <div className="voice-progress-container">
                                            <div className="voice-progress-bar">
                                                <div
                                                    className="voice-progress-fill"
                                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <div className="voice-time">
                                                {isPlaying ? formatAudioTime(currentTime) : formatAudioTime(duration)}
                                            </div>
                                        </div>

                                        <Mic size={16} className="voice-mic-icon" />
                                    </div>
                                ) : (
                                    // Regular File
                                    <div className="file-info">
                                        <div className="file-icon">📄</div>
                                        <div className="file-details">
                                            <div className="file-name">{message.fileName}</div>
                                            <div className="file-size">{formatFileSize(message.fileSize)}</div>
                                        </div>
                                        <button
                                            className="download-btn"
                                            onClick={() => window.open(`${SERVER_URL}${message.fileUrl}`, '_blank')}
                                        >
                                            Download
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <p className="message-text">{message.text}</p>
                                {message.isEdited && (
                                    <span className="edited-tag">edited</span>
                                )}
                            </>
                        )}

                        <div className="message-time">
                            {formatTime(message.createdAt || message.timestamp || new Date())}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="delete-modal" onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteType(null);
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Message?</h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '1rem' }}>
                            {deleteType === 'forEveryone'
                                ? 'This will remove the message for all participants.'
                                : 'This will remove the message from your view only.'}
                        </p>
                        <button
                            onClick={handleDeleteConfirm}
                            style={{ background: '#e50914' }}
                        >
                            {deleteType === 'forEveryone' ? 'Delete for Everyone' : 'Delete for Me'}
                        </button>
                        <button onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteType(null);
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageItem;