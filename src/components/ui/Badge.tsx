interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'gray' | 'amber'
  size?: 'sm' | 'md'
}

const variantClasses = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  amber: 'bg-amber-100 text-amber-700',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export default function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  )
}
