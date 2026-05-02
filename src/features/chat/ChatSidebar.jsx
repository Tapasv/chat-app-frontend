import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User, MoreVertical, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import FriendSearch from '../friends/FriendSearch';
import FriendRequests from '../friends/FriendRequests';

const ChatSidebar = ({
    currentUser,
    friends,
    onlineUsers,
    blockedUsers,
    pendingRequests,
    sentRequests,
    activeUser,
    showSidebar,
    unreadCounts = {},
    onSelectFriend,
    onSendRequest,
    onAcceptRequest,
    onRejectRequest,
    onUnfriend,
    onLogout
}) => {
    const [showSearch, setShowSearch] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [friendMenu, setFriendMenu] = useState(null);
    const settingsRef = useRef(null);
    const friendMenuRef = useRef(null);
    const navigate = useNavigate();

    // Close settings dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close friend context menu on outside click — separate listener
    useEffect(() => {
        if (!friendMenu) return; // only active when a menu is open
        const handler = (e) => {
            if (friendMenuRef.current && !friendMenuRef.current.contains(e.target)) {
                setFriendMenu(null);
            }
        };
        // Use mousedown so it fires before the button's onClick
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [friendMenu]);

    const filtered = friends.filter(f =>
        f.Username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`
            fixed md:static inset-y-0 left-0 z-40
            w-full md:w-80 flex flex-col
            bg-gray-900 border-r border-gray-800/60
            transition-transform duration-300
            ${!showSidebar ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
        `}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800/60 bg-gray-900">
                <div onClick={() => navigate('/edit-profile')} className="cursor-pointer flex-shrink-0">
                    <Avatar user={currentUser} size="md" showOnline isOnline={true} />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{currentUser?.Username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        <p className="text-xs text-green-400">Active now</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        title="Add Friend"
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                    </button>

                    <div ref={settingsRef} className="relative">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                        >
                            <Settings size={17} />
                        </button>

                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="px-3 py-2 border-b border-gray-700/50">
                                    <p className="text-xs text-gray-400">Signed in as</p>
                                    <p className="text-sm font-medium truncate">{currentUser?.Username}</p>
                                </div>
                                <button
                                    onClick={() => { navigate('/edit-profile'); setShowSettings(false); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-700/50 flex gap-2.5 items-center text-sm transition-colors"
                                >
                                    <User size={15} className="text-gray-400" /> Edit Profile
                                </button>
                                {currentUser?.role === 'Admin' && (
                                    <button
                                        onClick={() => { navigate('/admin'); setShowSettings(false); }}
                                        className="w-full px-4 py-2.5 text-left hover:bg-gray-700/50 flex gap-2.5 items-center text-sm transition-colors"
                                    >
                                        <Settings size={15} className="text-gray-400" /> Admin Panel
                                    </button>
                                )}
                                <div className="border-t border-gray-700/50">
                                    <button
                                        onClick={onLogout}
                                        className="w-full px-4 py-2.5 text-left hover:bg-red-500/10 flex gap-2.5 items-center text-sm text-red-400 transition-colors"
                                    >
                                        <LogOut size={15} /> Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Friend Search Panel */}
            {showSearch && (
                <FriendSearch
                    friends={friends}
                    sentRequests={sentRequests}
                    onRequestSent={onSendRequest}
                    onClose={() => setShowSearch(false)}
                />
            )}

            {/* Search filter */}
            <div className="px-3 py-2.5">
                <div className="relative">
                    <svg className="absolute left-3 top-2.5 text-gray-500" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 rounded-lg bg-gray-800/80 outline-none text-sm placeholder-gray-500 focus:bg-gray-800 transition-colors"
                    />
                </div>
            </div>

            {/* Pending Requests */}
            <FriendRequests
                requests={pendingRequests}
                onAccept={onAcceptRequest}
                onReject={onRejectRequest}
            />

            {/* Section label */}
            {filtered.length > 0 && (
                <div className="px-4 py-1">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        Messages — {filtered.length}
                    </p>
                </div>
            )}

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 px-4">
                        <MessageSquare size={28} className="mb-2 opacity-40" />
                        <p className="text-sm font-medium">No friends yet</p>
                        <p className="text-xs mt-0.5 text-gray-600">Use + to find people</p>
                    </div>
                ) : (
                    filtered.map((friend) => {
                        const isActive = activeUser?._id === friend._id;
                        const isOnline = onlineUsers.includes(friend._id);
                        const isBlocked = blockedUsers.includes(friend._id);
                        const unread = unreadCounts[friend._id] || 0;
                        const isMenuOpen = friendMenu === friend._id;

                        return (
                            <div
                                key={friend._id}
                                onClick={() => { if (!isMenuOpen) onSelectFriend(friend); }}
                                className={`
                                    relative flex items-center gap-3 px-3 py-2.5 mx-1.5 my-0.5
                                    rounded-xl cursor-pointer transition-all duration-150
                                    ${isActive
                                        ? 'bg-blue-600/20 border border-blue-500/20'
                                        : 'hover:bg-gray-800/70 border border-transparent'
                                    }
                                `}
                            >
                                <Avatar user={friend} size="md" showOnline isOnline={isOnline} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-300' : 'text-gray-100'}`}>
                                            {friend.Username}
                                        </p>
                                        {unread > 0 && (
                                            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                                {unread > 99 ? '99+' : unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${
                                        isBlocked ? 'text-red-400' :
                                        isOnline ? 'text-green-400' :
                                        'text-gray-500'
                                    }`}>
                                        {isBlocked ? 'Blocked' : isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>

                                {/* 3-dot button — attach ref when this menu is open */}
                                <div ref={isMenuOpen ? friendMenuRef : null}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFriendMenu(isMenuOpen ? null : friend._id);
                                        }}
                                        className="p-1 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                                    >
                                        <MoreVertical size={15} />
                                    </button>

                                    {isMenuOpen && (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-2 top-12 bg-gray-800 border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => { onUnfriend(friend._id); setFriendMenu(null); }}
                                                className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 w-full text-left text-sm flex items-center gap-2 transition-colors"
                                            >
                                                Remove Friend
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;