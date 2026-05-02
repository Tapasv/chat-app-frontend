const variants = {
    default: 'bg-elevated text-text-secondary border-border',
    success: 'bg-status-success/10 text-status-success border-status-success/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    danger: 'bg-status-error/10 text-status-error border-status-error/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
};

const Badge = ({ children, variant = 'default', className = '' }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-2xs font-medium border ${variants[variant]} ${className}`}>
        {children}
    </span>
);

export default Badge;