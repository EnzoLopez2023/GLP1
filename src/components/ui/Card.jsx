import clsx from 'clsx'

// Card — sits on the wood-50 page background as warm "paper". No harsh white,
// no harsh border. A custom className with a `bg-…` utility wins (clsx
// resolves later utilities last), so colored prominence cards still work.
export default function Card({ children, className, onClick, padding = true }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-[#fffaf3] rounded-2xl shadow-tile',
        padding && 'p-4',
        onClick && 'cursor-pointer hover:bg-[#fff7eb] transition-colors',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-wood-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-wood-600 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
