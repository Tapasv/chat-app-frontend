const Spinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-3.5 h-3.5 border',
        md: 'w-6 h-6 border-2',
        lg: 'w-10 h-10 border-2'
    };
    return (
        <div className={`${sizes[size]} border-border border-t-accent rounded-full animate-spin ${className}`} />
    );
};

export default Spinner;