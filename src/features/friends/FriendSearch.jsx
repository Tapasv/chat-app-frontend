import { useState } from 'react';
import { friendApi } from '../../lib/api/friend.api';
import Avatar from '../../components/ui/Avatar';

const FriendSearch = ({ friends, sentRequests, onRequestSent, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        const q = e.target.value;
        setQuery(q);
        if (!q.trim()) { setResults([]); return; }

        try {
            const data = await friendApi.searchUsers(q);
            setResults(Array.isArray(data) ? data : []);
        } catch {
            setResults([]);
        }
    };

    return (
        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900">
            <input
                type="text"
                placeholder="Search users by username..."
                value={query}
                onChange={handleSearch}
                autoFocus
                className="w-full px-4 py-2 rounded-lg bg-gray-800 outline-none text-sm mb-3"
            />

            {results.length === 0 && query && (
                <p className="text-sm text-gray-500 text-center">No users found</p>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((u) => {
                    const isFriend = friends.some(f => f._id === u._id);
                    const isSent = sentRequests.some(r => r.receiver?._id === u._id);

                    return (
                        <div key={u._id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <Avatar user={u} size="sm" />
                                <span className="text-sm">{u.Username}</span>
                            </div>
                            {isFriend ? (
                                <span className="text-xs text-green-400">Friend</span>
                            ) : isSent ? (
                                <span className="text-xs text-yellow-400">Requested</span>
                            ) : (
                                <button
                                    onClick={() => onRequestSent(u._id)}
                                    className="text-xs px-3 py-1 bg-blue-600 rounded-full hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <button onClick={onClose} className="mt-3 w-full text-xs text-gray-400 hover:underline">
                Close
            </button>
        </div>
    );
};

export default FriendSearch;