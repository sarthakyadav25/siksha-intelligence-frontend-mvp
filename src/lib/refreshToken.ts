const REFRESH_TOKEN_KEY = 'si_refresh_token'

export const getStoredRefreshToken = (): string | null => {
  try {
    const value = window.localStorage.getItem(REFRESH_TOKEN_KEY)
    return value && value.trim().length > 0 ? value : null
  } catch {
    return null
  }
}

export const setStoredRefreshToken = (token: string): void => {
  try {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export const clearStoredRefreshToken = (): void => {
  try {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // ignore
  }
}
