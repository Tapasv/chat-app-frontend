import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import apimessage from '../apimessage';

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const MessageItem = ({ message, currentUser, onMessageUpdate, onMessageDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.text || '');
    const [showOptions, setShowOptions] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const optionsRef = useRef(null);

    const isCurrentUser = message.sender?._id === currentUser?._id;
    const isDeletedForEveryone = message.deletedForEveryone;
    const isFile = message.fileUrl;

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

    const canEditOrDelete = () => {
        const messageTime = new Date(message.createdAt).getTime();
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000;
        return (now - messageTime) < fifteenMinutes;
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

    const handleDelete = async (deleteType) => {
        try {
            const res = await apimessage.delete(`/delete/${message._id}`, {
                data: { deleteType }
            });

            toast.success(res.data.message);
            setShowDeleteModal(false);
            setShowOptions(false);

            if (deleteType === 'forMe') {
                onMessageDelete(message._id);
            } else {
                onMessageUpdate(res.data.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete message');
        }
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
                        <div className="options-menu">
                            {/* FOR SENDER: Show Edit and Delete for Everyone (within 15 min) */}
                            {isCurrentUser && !isFile && canEditOrDelete() && (
                                <button onClick={() => {
                                    setIsEditing(true);
                                    setShowOptions(false);
                                }}>
                                    ✏️ Edit
                                </button>
                            )}
                            
                            {isCurrentUser && canEditOrDelete() && (
                                <button onClick={() => {
                                    setShowDeleteModal(true);
                                    setShowOptions(false);
                                }}>
                                    🗑️ Delete for Everyone
                                </button>
                            )}
                            
                            {/* FOR EVERYONE: Show Delete for Me */}
                            <button onClick={() => {
                                handleDelete('forMe');
                            }}>
                                🗑️ Delete for Me
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
                                ) : (
                                    <div className="file-info">
                                        <div className="file-icon">📄</div>
                                        <div className="file-details">
                                            <div className="file-name">{message.fileName}</div>
                                            <div className="file-size">{formatFileSize(message.fileSize)}</div>
                                        </div>
                                    </div>
                                )}
                                <button
                                    className="download-btn"
                                    onClick={() => window.open(`${SERVER_URL}${message.fileUrl}`, '_blank')}
                                >
                                    Download
                                </button>
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
                <div className="delete-modal" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Message for Everyone?</h3>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                            This will remove the message for all participants.
                        </p>
                        <button 
                            onClick={() => handleDelete('forEveryone')}
                            style={{ background: '#e50914' }}
                        >
                            Yes, Delete for Everyone
                        </button>
                        <button onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageItem;