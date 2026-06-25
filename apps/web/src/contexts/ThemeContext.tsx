import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Theme = 'default' | 'dark' | 'navy'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'default', setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('novus_theme') as Theme) || 'default'
  )

  function setTheme(t: Theme) {
    localStorage.setItem('novus_theme', t)
    setThemeState(t)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
