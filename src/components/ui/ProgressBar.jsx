import clsx from 'clsx'

export default function ProgressBar({ value, max = 100, color = 'brand', label, showValue, unit }) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  const colors = {
    brand:  'bg-brand-500',
    green:  'bg-green-500',
    orange: 'bg-orange-500',
    red:    'bg-red-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs font-medium text-gray-600">{label}</span>}
          {showValue && (
            <span className="text-xs text-gray-500">
              {value}{unit && ` ${unit}`} / {max}{unit && ` ${unit}`}
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
