export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="p-4 bg-gray-50 rounded-2xl mb-4">
          <Icon size={32} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
