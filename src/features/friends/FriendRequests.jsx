import Avatar from '../../components/ui/Avatar';

const FriendRequests = ({ requests, onAccept, onReject }) => {
    if (requests.length === 0) return null;

    return (
        <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Friend Requests
            </h3>
            <div className="space-y-2">
                {requests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800">
                        <div className="flex items-center gap-2">
                            <Avatar user={req.sender} size="sm" />
                            <span className="text-sm">{req.sender.Username}</span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onAccept(req._id, req.sender)}
                                className="px-2 py-1 text-xs bg-green-600 rounded hover:bg-green-700"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => onReject(req._id, req.sender._id)}
                                className="px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-700"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendRequests;