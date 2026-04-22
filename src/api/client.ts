import type {
  Member,
  Project,
  Task,
  TaskComment,
  TaskActivity,
  Workspace,
  WorkspaceRole,
  TaskStatus,
} from '@/types'

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

// ── Auth ────────────────────────────────────────────────

interface AuthResponse {
  token: string
  user: { id: string; name: string; email: string }
}

// ── API ─────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    me: () => request<{ id: string; name: string; email: string }>('/api/auth/me'),
  },

  workspace: {
    get: () => request<Workspace>('/api/workspace'),
  },

  members: {
    list: () => request<Member[]>('/api/members'),
    add: (data: {
      name: string
      email: string
      password: string
      role?: WorkspaceRole
      projectIds?: string[]
    }) =>
      request<Member>('/api/members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    invite: (data: { email: string; role?: WorkspaceRole }) =>
      request<Member & { inviteToken: string; inviteLink: string }>('/api/members/invite', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getInviteInfo: (token: string) =>
      request<{ email: string; workspaceName: string; role: string }>(
        `/api/members/invite/${token}`
      ),
    acceptInvite: (token: string, data: { name: string; password: string }) =>
      request<{ message: string }>(`/api/members/invite/${token}/accept`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateRole: (memberId: string, role: WorkspaceRole) =>
      request<Member>(`/api/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    remove: (memberId: string) =>
      request<void>(`/api/members/${memberId}`, { method: 'DELETE' }),
  },

  projects: {
    list: () => request<Project[]>('/api/projects'),
    get: (id: string) => request<Project>(`/api/projects/${id}`),
    create: (data: {
      name: string
      key: string
      description: string
      ownerId: string
      dueDate: string
      memberIds?: string[]
    }) =>
      request<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : ''
      return request<Task[]>(`/api/tasks${query}`)
    },
    get: (id: string) => request<Task>(`/api/tasks/${id}`),
    create: (data: {
      title: string
      description: string
      projectId: string
      assigneeId: string
      priority: string
      type: string
      dueDate: string
      status?: string
    }) =>
      request<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{
      status: TaskStatus
      assigneeId: string
      projectId: string
      description: string
      priority: string
      title: string
      dueDate: string
    }>) =>
      request<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/tasks/${id}`, { method: 'DELETE' }),

    // Comments
    getComments: (taskId: string) =>
      request<(TaskComment & { authorName: string })[]>(`/api/tasks/${taskId}/comments`),
    addComment: (taskId: string, body: string) =>
      request<TaskComment>(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),

    // Activity
    getActivity: (taskId: string) =>
      request<(TaskActivity & { actorName: string })[]>(`/api/tasks/${taskId}/activity`),
  },
}
