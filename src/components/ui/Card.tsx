import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export default function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
