const AUTH_KEY = 'saas_dashboard_auth'

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  return localStorage
}

export function getToken(): string | null {
  try {
    const raw = getStorage()?.getItem(AUTH_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { token?: string }
    return data?.token ?? null
  } catch {
    return null
  }
}

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '' : 'http://localhost:4000')

type RequestOptions = RequestInit

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${baseURL}${path}`, { ...options, headers })

  if (response.status === 204) return undefined as T

  const text = await response.text()

  if (!response.ok) {
    let message = response.statusText
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? message
    } catch {
      if (text) message = text
    }
    throw new Error(message || `HTTP ${response.status}`)
  }

  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: string; name: string; email: string } }>(
        '/api/authlogin',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: { id: string; name: string; email: string } }>(
        '/api/authregister',
        { method: 'POST', body: JSON.stringify({ name, email, password }) }
      ),
    me: () => request<{ id: string; name: string; email: string }>('/api/authme'),
  },
}
