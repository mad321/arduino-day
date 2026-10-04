import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/** Animated number that tweens from its previous value — used for KPI micro-interactions. */
export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(value)
  const reduced = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduced) {
      node.textContent = value.toFixed(decimals)
      previous.current = value
      return
    }
    const controls = animate(previous.current, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = v.toFixed(decimals)
      },
    })
    previous.current = value
    return () => controls.stop()
  }, [value, decimals, reduced])

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}
    </span>
  )
}
