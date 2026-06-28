'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isAuto: boolean
  resetToAuto: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isAuto: true,
  resetToAuto: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function isNightNow(): boolean {
  const d = new Date()
  const mins = d.getHours() * 60 + d.getMinutes()
  // Dark from 18:30 (6:30pm) → 6:30am (390 mins)
  return mins >= 18 * 60 + 30 || mins < 6 * 60 + 30
}

function applyClass(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isAuto, setIsAuto] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const manual = localStorage.getItem('fh-theme-manual') === 'true'
    const saved = localStorage.getItem('fh-theme') as Theme | null

    if (manual && saved) {
      setIsAuto(false)
      setTheme(saved)
      applyClass(saved === 'dark')
    } else {
      const dark = isNightNow()
      setTheme(dark ? 'dark' : 'light')
      applyClass(dark)
    }
  }, [])

  // Tick every 60s to check if we crossed 18:30 or 06:30
  useEffect(() => {
    if (!isAuto) return
    const id = setInterval(() => {
      const dark = isNightNow()
      setTheme(dark ? 'dark' : 'light')
      applyClass(dark)
    }, 60_000)
    return () => clearInterval(id)
  }, [isAuto])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setIsAuto(false)
    applyClass(next === 'dark')
    localStorage.setItem('fh-theme-manual', 'true')
    localStorage.setItem('fh-theme', next)
  }, [theme])

  const resetToAuto = useCallback(() => {
    setIsAuto(true)
    localStorage.removeItem('fh-theme-manual')
    localStorage.removeItem('fh-theme')
    const dark = isNightNow()
    setTheme(dark ? 'dark' : 'light')
    applyClass(dark)
  }, [])

  // Avoid flash: render children immediately, theme is applied synchronously in useEffect
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAuto, resetToAuto }}>
      {/* Suppress hydration mismatch on the html class */}
      {children}
    </ThemeContext.Provider>
  )
}
