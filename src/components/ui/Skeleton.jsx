const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-elevated rounded-md ${className}`} />
);

export const SkeletonMessage = () => (
    <div className="flex gap-3 px-4 py-2">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-48" />
        </div>
    </div>
);

export const SkeletonFriend = () => (
    <div className="flex items-center gap-3 px-3 py-2.5 mx-1.5">
        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-16" />
        </div>
    </div>
);

export default Skeleton;