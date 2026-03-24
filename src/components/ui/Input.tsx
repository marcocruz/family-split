import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full ${prefix ? 'pl-8' : 'px-4'} pr-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
