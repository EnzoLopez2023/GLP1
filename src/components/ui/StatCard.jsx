import clsx from 'clsx'
import Card from './Card'

export default function StatCard({ label, value, unit, icon: Icon, color = 'blue', trend, sub }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-600',
    green:  'bg-green-50  text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red:    'bg-red-50    text-red-600',
    teal:   'bg-teal-50   text-teal-600',
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={clsx('p-2 rounded-xl', colors[color])}>
            <Icon size={20} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold text-gray-800">
              {value ?? '—'}
            </span>
            {unit && <span className="text-xs text-gray-500">{unit}</span>}
          </div>
          {(trend || sub) && (
            <p className="text-xs text-gray-500 mt-0.5">{trend || sub}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
