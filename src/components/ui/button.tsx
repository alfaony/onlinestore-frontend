
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    onClick,
    type = 'button',
}: {
    children: React.ReactNode
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    className?: string
    disabled?: boolean
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
}) {
    const baseStyles =
        'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sr-red'

    const sizeStyles =
        size === 'sm'
            ? 'px-3 py-1.5 text-xs'
            : size === 'md'
                ? 'px-4 py-2 text-sm'
                : 'px-6 py-3 text-base'

    const colorStyles =
        variant === 'primary'
            ? 'bg-sr-navy text-white hover:bg-sr-red'
            : variant === 'secondary'
                ? 'bg-sr-gold text-white hover:bg-sr-gold-l'
                : variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : variant === 'ghost'
                        ? 'bg-transparent text-sr-red hover:bg-sr-red/5'
                        : 'bg-transparent text-sr-red hover:bg-sr-red/5 border border-sr-red'

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseStyles} ${sizeStyles} ${colorStyles} ${className}`}
        >
            {children}
        </button>
    )
}