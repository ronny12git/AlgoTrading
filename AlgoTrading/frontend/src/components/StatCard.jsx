export default function StatCard({ label, value, sub, accent = '#00d9ff', prefix = '' }) {
  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden"
      style={{ '--accent': accent }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="font-mono text-[10px] tracking-[2px] text-muted uppercase mb-3">{label}</div>
      <div className="font-mono text-[26px] font-bold leading-none" style={{ color: accent === '#00d9ff' ? '#e2f0ff' : accent }}>
        {prefix}{value}
      </div>
      {sub && (
        <div className="font-mono text-[11px] text-muted mt-2">{sub}</div>
      )}
    </div>
  )
}