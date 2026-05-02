import { MoreVertical, UserX, Trash2, ChevronLeft } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import Avatar from '../../components/ui/Avatar';

const ChatHeader = ({ activeUser, isOnline, isBlocked, onBack, onBlock, onUnblock, onClearChat }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="flex items-center gap-3 px-4 h-14 bg-surface border-b border-border flex-shrink-0">
            <button onClick={onBack} className="md:hidden p-1.5 rounded-md hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors">
                <ChevronLeft size={18} />
            </button>

            <Avatar user={activeUser} size="md" showOnline isOnline={isOnline} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-text-primary truncate">{activeUser.Username}</p>
                    {isBlocked && (
                        <span className="text-2xs px-1.5 py-0.5 bg-status-error/10 text-status-error border border-status-error/20 rounded-sm font-medium">
                            Blocked
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {!isBlocked && (
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-status-online' : 'bg-text-muted'}`} />
                    )}
                    <p className={`text-xs ${isBlocked ? 'text-status-error' : isOnline ? 'text-status-online' : 'text-text-muted'}`}>
                        {isBlocked ? 'You blocked this user' : isOnline ? 'Active now' : 'Offline'}
                    </p>
                </div>
            </div>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-md hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors"
                >
                    <MoreVertical size={16} />
                </button>

                {showMenu && (
                    <div className="absolute right-0 mt-1 w-48 bg-elevated border border-border rounded-md shadow-xl z-50 overflow-hidden py-1">
                        {isBlocked ? (
                            <button
                                onClick={() => { onUnblock(); setShowMenu(false); }}
                                className="w-full px-3 py-2 hover:bg-overlay flex gap-2.5 items-center text-sm text-text-primary transition-colors"
                            >
                                <UserX size={14} className="text-text-secondary" /> Unblock user
                            </button>
                        ) : (
                            <button
                                onClick={() => { onBlock(); setShowMenu(false); }}
                                className="w-full px-3 py-2 hover:bg-overlay flex gap-2.5 items-center text-sm text-text-primary transition-colors"
                            >
                                <UserX size={14} className="text-text-secondary" /> Block user
                            </button>
                        )}
                        <div className="h-px bg-border mx-2 my-1" />
                        <button
                            onClick={() => { onClearChat(); setShowMenu(false); }}
                            className="w-full px-3 py-2 hover:bg-status-error/10 flex gap-2.5 items-center text-sm text-status-error transition-colors"
                        >
                            <Trash2 size={14} /> Clear conversation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHeader;