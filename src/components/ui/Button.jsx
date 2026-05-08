import clsx from 'clsx'

const variants = {
  primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm',
  ghost:     'hover:bg-gray-100 text-gray-600',
  outline:   'border border-gray-300 hover:bg-gray-50 text-gray-700',
}

const sizes = {
  xs: 'text-xs px-2.5 py-1.5 rounded-lg',
  sm: 'text-sm px-3 py-2 rounded-xl',
  md: 'text-sm px-4 py-2.5 rounded-xl',
  lg: 'text-base px-5 py-3 rounded-xl',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  className, disabled, onClick, type = 'button', fullWidth,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}
