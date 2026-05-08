import clsx from 'clsx'

const colors = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-100 text-yellow-700',
}

export default function Badge({ children, color = 'gray', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
      colors[color],
      className
    )}>
      {children}
    </span>
  )
}
