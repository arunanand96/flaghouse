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

export function useTheme() { return useContext(ThemeContext) }

function isNightNow(): boolean {
  const d = new Date()
  const mins = d.getHours() * 60 + d.getMinutes()
  return mins >= 18 * 60 + 30 || mins < 6 * 60 + 30
}

function applyClass(dark: boolean) {
  if (dark) document.documentElement.classList.add('dark')
  else       document.documentElement.classList.remove('dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isAuto, setIsAuto] = useState(true)

  useEffect(() => {
    const manual = localStorage.getItem('fh-theme-manual') === 'true'
    const saved  = localStorage.getItem('fh-theme') as Theme | null
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

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAuto, resetToAuto }}>
      {children}
    </ThemeContext.Provider>
  )
}
