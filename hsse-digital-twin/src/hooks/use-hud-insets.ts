import { useLayoutEffect, type RefObject } from 'react'

/**
 * Publishes the space taken by the header (top) and activity ticker (bottom) as
 * --hud-top / --hud-bottom, so the inspection panel and toasts fit between them
 * however the header wraps at a given width.
 */
export function useHudInsets(header: RefObject<HTMLElement | null>, footer: RefObject<HTMLElement | null>, gap = 8) {
  useLayoutEffect(() => {
    const root = document.documentElement
    const update = () => {
      if (header.current)
        root.style.setProperty('--hud-top', `${header.current.getBoundingClientRect().bottom + gap}px`)
      if (footer.current) {
        root.style.setProperty(
          '--hud-bottom',
          `${window.innerHeight - footer.current.getBoundingClientRect().top + gap}px`,
        )
      }
    }
    update()
    const observer = new ResizeObserver(update)
    if (header.current) observer.observe(header.current)
    if (footer.current) observer.observe(footer.current)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [header, footer, gap])
}
