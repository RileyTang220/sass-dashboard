/**
 * API client for SaaS Analytics Dashboard.
 * Base URL: VITE_API_BASE_URL or http://localhost:4000
 */
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

// Production on Vercel: use same origin so /api/* hits Vercel serverless. Dev: use mock server.
const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? '' : 'http://localhost:4000')

export type RequestOptions = RequestInit & { params?: Record<string, string> }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...init } = options
  const urlStr = baseURL
    ? (() => {
        const u = new URL(path, baseURL)
        if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
        return u.toString()
      })()
    : path + (params ? '?' + new URLSearchParams(params).toString() : '')
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(urlStr, { ...init, headers })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  if (!res.ok) {
    let message = res.statusText
    try {
      const json = JSON.parse(text) as { message?: string }
      message = json.message ?? message
    } catch {
      if (text) message = text
    }
    throw new Error(message || `HTTP ${res.status}`)
  }
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

// --- Auth ---
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
    me: () =>
      request<{ id: string; name: string; email: string }>('/api/authme'),
  },

  users: {
    list: () => request<import('@/types').User[]>('/api/users'),
    create: (body: { name: string; email: string; role?: string }) =>
      request<import('@/types').User>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; email: string; role: string; status: string }>) =>
      request<import('@/types').User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/api/users/${id}`, { method: 'DELETE' }),
  },

  sales: {
    list: (params?: { from?: string; to?: string; status?: string; limit?: string; sort?: string }) =>
      request<import('@/types').Sale[]>('/api/sales', { params: params as Record<string, string> }),
    create: (body: { customerName: string; productName: string; amount: number; status?: string }) =>
      request<import('@/types').Sale>('/api/sales', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ customerName: string; productName: string; amount: number; status: string }>) =>
      request<import('@/types').Sale>(`/api/sales/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<void>(`/api/sales/${id}`, { method: 'DELETE' }),
  },

  dashboard: {
    summary: () =>
      request<{
        totalRevenue: number
        totalSales: number
        activeUsers: number
        conversionRate: number
        recentSales: import('@/types').Sale[]
      }>('/api/dashsummary'),
  },

  analytics: {
    overview: () =>
      request<{
        revenueGrowthPercent: number
        deviceBreakdown: { labels: string[]; data: number[] }
        trafficSources: { labels: string[]; data: number[] }
        conversionFunnel: { labels: string[]; data: number[] }
        topProducts: { labels: string[]; data: number[] }
        topCampaigns: { labels: string[]; data: number[] }
        userGrowth: { labels: string[]; data: number[] }
      }>('/api/analyticsoverview'),
  },

  billing: {
    getSubscription: () =>
      request<{
        plan: string
        status: string
        startDate: string
        endDate: string
        isCanceled: boolean
      }>('/api/billsubscription'),
    updateSubscription: (action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate') =>
      request<{
        plan: string
        status: string
        startDate: string
        endDate: string
        isCanceled: boolean
      }>('/api/billsubscription', {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    getInvoices: () =>
      request<import('@/types').Invoice[]>('/api/billinvoice'),
  },
}
