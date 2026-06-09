import api from './index'
import type {
  User, Event, MarketplaceItem, Club,
  LostFoundItem, Feedback, DashboardStats, PaginatedResponse, ActivityLog,
} from '../types'

function normaliseEvent(e: any): Event {
  return {
    ...e,
    rsvp_count: e.rsvp_count ?? 0,
    pending_rsvp_count: e.pending_rsvp_count ?? 0,
    creator: e.creator ?? null,
    creator_name: e.creator_name ?? null,
  }
}

function normaliseFeedback(f: any): Feedback {
  return {
    ...f,
    submitted_by: f.submitted_by ?? null,
    submitter: f.submitted_by ?? null,  // backwards compat
  }
}

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', {
      email: email.trim().toLowerCase(), password,
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
    return { ...data, data: data.data.map(normaliseEvent) }
  },
  getRsvps: async (id: number) => {
    const { data } = await api.get(`/events/${id}/rsvps`)
    return data
  },
  approveRsvp: async (eventId: number, rsvpId: number) => {
    const { data } = await api.patch(`/events/${eventId}/rsvps/${rsvpId}`, { action: 'approve' })
    return data
  },
  rejectRsvp: async (eventId: number, rsvpId: number) => {
    const { data } = await api.patch(`/events/${eventId}/rsvps/${rsvpId}`, { action: 'reject' })
    return data
  },
  getAttendance: async (id: number) => {
    const { data } = await api.get(`/events/${id}/attendance`)
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
  markSold: async (id: number, buyerId?: number): Promise<MarketplaceItem> => {
    const { data } = await api.patch(`/marketplace/${id}/sold`, buyerId ? { buyer_id: buyerId } : {})
    return data
  },
  markUnsold: async (id: number): Promise<MarketplaceItem> => {
    const { data } = await api.patch(`/marketplace/${id}/unsold`)
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
    return { ...data, data: data.data.map((c: any) => ({
      ...c,
      member_count: c.member_count ?? 0,
      meeting_location: c.meeting_location ?? null,
    })) }
  },
  getMembers: async (id: number) => {
    const { data } = await api.get(`/clubs/${id}/members`)
    return data
  },
  approveMember: async (clubId: number, requestId: number) => {
    const { data } = await api.patch(`/clubs/${clubId}/members/${requestId}`, { action: 'approve' })
    return data
  },
  rejectMember: async (clubId: number, requestId: number) => {
    const { data } = await api.patch(`/clubs/${clubId}/members/${requestId}`, { action: 'reject' })
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
  claim: async (id: number): Promise<LostFoundItem> => {
    const { data } = await api.patch(`/lost-found/${id}/claim`)
    return data
  },
  markFound: async (id: number): Promise<LostFoundItem> => {
    const { data } = await api.patch(`/lost-found/${id}/found`)
    return data
  },
  delete: async (id: number) => {
    await api.delete(`/lost-found/${id}`)
  },
}

// ── Feedback ──────────────────────────────────────────
export const feedbackAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Feedback>> => {
    const { data } = await api.get('/feedback', { params: { page } })
    return { ...data, data: data.data.map(normaliseFeedback) }
  },
  updateStatus: async (id: number, status: string): Promise<Feedback> => {
    const { data } = await api.patch(`/feedback/${id}/status`, { status })
    return normaliseFeedback(data)
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
