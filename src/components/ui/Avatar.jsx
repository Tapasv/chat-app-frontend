const Avatar = ({ user, size = 'md', showOnline = false, isOnline = false }) => {
    const sizes = {
        sm: 'w-7 h-7 text-xs',
        md: 'w-9 h-9 text-sm',
        lg: 'w-12 h-12 text-base'
    };
    const dotSizes = {
        sm: 'w-2 h-2 border',
        md: 'w-2.5 h-2.5 border-2',
        lg: 'w-3 h-3 border-2'
    };

    return (
        <div className="relative flex-shrink-0">
            {user?.profilePicture ? (
                <img
                    src={user.profilePicture}
                    alt={user.Username}
                    className={`${sizes[size]} rounded-full object-cover ring-1 ring-border`}
                />
            ) : (
                <div className={`${sizes[size]} rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-semibold text-accent`}>
                    {user?.Username?.[0]?.toUpperCase() || '?'}
                </div>
            )}
            {showOnline && (
                <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-surface ${isOnline ? 'bg-status-online' : 'bg-text-muted'}`} />
            )}
        </div>
    );
};

export default Avatar;