import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react'

import type { FeedTone } from '@/data/types'
import { TONE_HEX } from '@/lib/status'
import { useSiteStore, type Toast } from '@/store/site-store'

const TONE_ICON = { info: Info, safe: CircleCheck, caution: TriangleAlert, critical: OctagonX } satisfies Record<
  FeedTone,
  unknown
>

export function Toasts() {
  const toasts = useSiteStore((s) => s.toasts)
  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-[calc(var(--hud-bottom)+56px)] z-50 flex flex-col items-center gap-2 sm:left-1/2 sm:w-[380px] sm:-translate-x-1/2"
      aria-live="assertive"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useSiteStore((s) => s.dismissToast)
  const selectZone = useSiteStore((s) => s.selectZone)
  const selected = useSiteStore((s) => s.selectedZoneId)
  const Icon = TONE_ICON[toast.tone]
  const hex = TONE_HEX[toast.tone]

  useEffect(() => {
    const id = window.setTimeout(() => dismiss(toast.id), toast.tone === 'critical' ? 9000 : 5000)
    return () => window.clearTimeout(id)
  }, [toast.id, toast.tone, dismiss])

  return (
    <motion.div
      layout
      role={toast.tone === 'critical' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className="glass pointer-events-auto flex w-full items-start gap-3 p-3"
      style={{ borderColor: `${hex}66`, boxShadow: toast.tone === 'critical' ? `0 0 32px -6px ${hex}` : undefined }}
    >
      <Icon className="mt-0.5 size-4 shrink-0" style={{ color: hex }} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-zinc-100">{toast.title}</div>
        {toast.body && <div className="mt-0.5 text-xs text-zinc-400">{toast.body}</div>}
        {toast.zoneId && toast.zoneId !== selected && (
          <button
            type="button"
            onClick={() => {
              selectZone(toast.zoneId!)
              dismiss(toast.id)
            }}
            className="mt-1.5 cursor-pointer text-xs font-medium text-brand hover:underline"
          >
            Inspect zone →
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="cursor-pointer text-zinc-500 hover:text-zinc-200"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  )
}
