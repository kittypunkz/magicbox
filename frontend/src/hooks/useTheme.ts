// Always dark mode - no toggle
export function useTheme() {
  // Always dark
  return {
    theme: 'dark' as const,
    isDark: true,
    toggleTheme: () => {}, // No-op
    setLight: () => {}, // No-op
    setDark: () => {}, // No-op
  };
}
