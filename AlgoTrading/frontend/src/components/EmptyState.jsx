export default function EmptyState({ icon, title, text }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-4 opacity-30">{icon}</div>
      <div className="font-semibold text-white text-base mb-2">{title}</div>
      <div className="text-muted text-sm leading-relaxed">{text}</div>
    </div>
  )
}