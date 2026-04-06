import api from './index'
import type {
  User, Event, MarketplaceItem, Club,
  LostFoundItem, Feedback, DashboardStats, PaginatedResponse, ActivityLog,
} from '../types'

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })
    if (data.user.role !== 'admin') throw new Error('Admin access required')
    return data as { user: User; token: string }
  },
  me: async (token: string) => {
    const { data } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data as User
  },
}

// ── Stats ─────────────────────────────────────────────
export const statsAPI = {
  get: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/admin/stats')
    return data
  },
}

// ── Users ─────────────────────────────────────────────
export const usersAPI = {
  getAll: async (page = 1, search = ''): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/admin/users', { params: { page, search: search || undefined } })
    return data
  },
  updateRole: async (id: number, role: string) => {
    await api.patch(`/admin/users/${id}/role`, { role })
  },
  delete: async (id: number) => {
    await api.delete(`/admin/users/${id}`)
  },
}

// ── Events ────────────────────────────────────────────
export const eventsAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Event>> => {
    const { data } = await api.get('/events', { params: { page } })
    return data
  },
  delete: async (id: number) => {
    await api.delete(`/events/${id}`)
  },
}

// ── Marketplace ───────────────────────────────────────
export const marketplaceAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<MarketplaceItem>> => {
    const { data } = await api.get('/marketplace', { params: { page } })
    return data
  },
  delete: async (id: number) => {
    await api.delete(`/marketplace/${id}`)
  },
}

// ── Clubs ─────────────────────────────────────────────
export const clubsAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Club>> => {
    const { data } = await api.get('/clubs', { params: { page } })
    return data
  },
  delete: async (id: number) => {
    await api.delete(`/clubs/${id}`)
  },
}

// ── Lost & Found ──────────────────────────────────────
export const lostFoundAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<LostFoundItem>> => {
    const { data } = await api.get('/lost-found', { params: { page } })
    return data
  },
  markClaimed: async (id: number) => {
    await api.patch(`/lost-found/${id}/claimed`)
  },
}

// ── Feedback ──────────────────────────────────────────
export const feedbackAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Feedback>> => {
    const { data } = await api.get('/feedback', { params: { page } })
    return data
  },
  updateStatus: async (id: number, status: string) => {
    await api.patch(`/feedback/${id}/status`, null, { params: { status } })
  },
}

// ── Activity Logs ─────────────────────────────────────
export const activityAPI = {
  getAll: async (page = 1, action = ''): Promise<PaginatedResponse<ActivityLog>> => {
    const { data } = await api.get('/admin/activity', {
      params: { page, action: action || undefined },
    })
    return data
  },
}
