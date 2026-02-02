import { defineStore } from 'pinia'
import { ref } from 'vue'

export const themes = {
  dark: {
    name: 'Dark Poker',
    primary: '#4299e1',
    secondary: '#3182ce',
    background: '#1a202c',
    surface: '#2d3748',
    surfaceLight: '#4a5568',
    text: '#ffffff',
    textSecondary: '#a0aec0',
    success: '#48bb78',
    warning: '#ed8936',
    error: '#f56565',
    accent: '#9f7aea'
  },
  light: {
    name: 'Light Classic',
    primary: '#3182ce',
    secondary: '#2c5282',
    background: '#f7fafc',
    surface: '#ffffff',
    surfaceLight: '#edf2f7',
    text: '#1a202c',
    textSecondary: '#4a5568',
    success: '#38a169',
    warning: '#dd6b20',
    error: '#e53e3e',
    accent: '#805ad5'
  },
  midnight: {
    name: 'Midnight Blue',
    primary: '#667eea',
    secondary: '#5a67d8',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceLight: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    accent: '#8b5cf6'
  },
  forest: {
    name: 'Forest Green',
    primary: '#10b981',
    secondary: '#059669',
    background: '#022c22',
    surface: '#064e3b',
    surfaceLight: '#065f46',
    text: '#ecfdf5',
    textSecondary: '#6ee7b7',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    accent: '#a78bfa'
  },
  sunset: {
    name: 'Sunset Orange',
    primary: '#f97316',
    secondary: '#ea580c',
    background: '#1c1917',
    surface: '#292524',
    surfaceLight: '#44403c',
    text: '#fafaf9',
    textSecondary: '#a8a29e',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    accent: '#ec4899'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    secondary: '#0284c7',
    background: '#0c4a6e',
    surface: '#075985',
    surfaceLight: '#0369a1',
    text: '#f0f9ff',
    textSecondary: '#bae6fd',
    success: '#14b8a6',
    warning: '#f59e0b',
    error: '#f43f5e',
    accent: '#a855f7'
  },
  royal: {
    name: 'Royal Purple',
    primary: '#a855f7',
    secondary: '#9333ea',
    background: '#1e1b4b',
    surface: '#312e81',
    surfaceLight: '#4c1d95',
    text: '#faf5ff',
    textSecondary: '#d8b4fe',
    success: '#22d3ee',
    warning: '#fbbf24',
    error: '#fb7185',
    accent: '#f472b6'
  },
  neon: {
    name: 'Neon Cyber',
    primary: '#06b6d4',
    secondary: '#0891b2',
    background: '#18181b',
    surface: '#27272a',
    surfaceLight: '#3f3f46',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    success: '#84cc16',
    warning: '#facc15',
    error: '#f43f5e',
    accent: '#e879f9'
  }
}

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('dark')
  
  // Load theme from localStorage on init
  const savedTheme = localStorage.getItem('poker_theme')
  if (savedTheme && themes[savedTheme]) {
    currentTheme.value = savedTheme
  }
  
  function setTheme(themeName) {
    if (themes[themeName]) {
      currentTheme.value = themeName
      localStorage.setItem('poker_theme', themeName)
      applyTheme()
    }
  }
  
  function applyTheme() {
    const theme = themes[currentTheme.value]
    const root = document.documentElement
    
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-secondary', theme.secondary)
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-surface', theme.surface)
    root.style.setProperty('--color-surface-light', theme.surfaceLight)
    root.style.setProperty('--color-text', theme.text)
    root.style.setProperty('--color-text-secondary', theme.textSecondary)
    root.style.setProperty('--color-success', theme.success)
    root.style.setProperty('--color-warning', theme.warning)
    root.style.setProperty('--color-error', theme.error)
    root.style.setProperty('--color-accent', theme.accent)
  }
  
  // Apply theme on store creation
  applyTheme()
  
  return {
    currentTheme,
    themes,
    setTheme,
    applyTheme
  }
})
