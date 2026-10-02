import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

// o script do index.html já salvou e aplicou o tema com essa mesma chave
const THEME_STORAGE_KEY = 'nexum_theme'
const TRANSITION_DURATION_MS = 500

let currentTheme: Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Theme {
  return currentTheme
}

function applyTheme(theme: Theme) {
  currentTheme = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
  listeners.forEach((listener) => listener())
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot)

  function toggleTheme(x: number, y: number) {
    const next: Theme = currentTheme === 'dark' ? 'light' : 'dark'
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!document.startViewTransition || reducedMotion) {
      applyTheme(next)
      return
    }

    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    const transition = document.startViewTransition(() => {
      flushSync(() => applyTheme(next))
    })

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: TRANSITION_DURATION_MS,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
      .catch(() => {
        // o navegador às vezes pula a transição, mas o tema já trocou
      })
  }

  return { theme, toggleTheme }
}
