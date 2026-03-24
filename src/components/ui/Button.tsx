import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses = {
  primary: 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={loading || disabled}
        className={`font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando...
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
