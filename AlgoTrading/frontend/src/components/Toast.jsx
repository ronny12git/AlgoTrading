import { useEffect } from 'react'
import { useStore } from '../store/useStore'

const COLORS = {
  success: 'border-l-success text-success',
  error:   'border-l-danger text-danger',
  info:    'border-l-accent text-accent',
}

export default function Toast() {
  const toast = useStore(s => s.toast)
  if (!toast) return null

  return (
    <div
      key={toast.id}
      className={`fixed bottom-6 right-6 z-[9999] bg-surface2 border border-border border-l-2 ${COLORS[toast.type] || COLORS.info}
        rounded-xl px-5 py-4 max-w-sm shadow-2xl animate-slide-up font-body text-sm text-white`}
    >
      {toast.msg}
    </div>
  )
}