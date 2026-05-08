import clsx from 'clsx'

export function FormField({ label, htmlFor, error, hint, children, required }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-wood-800">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint  && !error && <p className="text-xs text-wood-600">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      {...props}
      className={clsx(
        'block w-full rounded-xl border border-wood-200 bg-[#fffaf3] px-3 py-2.5 text-sm',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none',
        'placeholder:text-wood-400 transition-colors',
        props.disabled && 'bg-wood-100 text-wood-500',
        className,
      )}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      {...props}
      className={clsx(
        'block w-full rounded-xl border border-wood-200 px-3 py-2.5 text-sm',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none',
        'bg-[#fffaf3] transition-colors',
        className,
      )}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      {...props}
      className={clsx(
        'block w-full rounded-xl border border-wood-200 bg-[#fffaf3] px-3 py-2.5 text-sm',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none',
        'placeholder:text-wood-400 resize-none transition-colors',
        className,
      )}
    />
  )
}

/** 1–10 emoji slider */
export function ScaleInput({ value, onChange, min = 1, max = 10, labels }) {
  return (
    <div className="space-y-2">
      <input
        type="range" min={min} max={max}
        value={value ?? min}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
      <div className="flex justify-between text-xs text-wood-600">
        {labels ? (
          <>
            <span>{labels[0]}</span>
            <span className="font-semibold text-brand-700 text-sm">{value ?? '—'}</span>
            <span>{labels[1]}</span>
          </>
        ) : (
          <>
            <span>{min}</span>
            <span className="font-semibold text-brand-700 text-sm">{value ?? '—'}</span>
            <span>{max}</span>
          </>
        )}
      </div>
    </div>
  )
}
