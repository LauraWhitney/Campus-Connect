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
  getAll: async (page = 1, search = '', faculty = ''): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get('/admin/users', {
      params: { page, search: search || undefined, faculty: faculty || undefined },
    })
    return data
  },
  getFaculties: async (): Promise<string[]> => {
    const { data } = await api.get('/admin/faculties')
    return data.faculties
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
  getAll: async (page = 1, approvalStatus = ''): Promise<PaginatedResponse<Event>> => {
    const { data } = await api.get('/events', { params: { page, approval_status: approvalStatus || undefined } })
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
  approveEvent: async (eventId: number) => {
    const { data } = await api.patch(`/events/${eventId}/approval`, { action: 'approve' })
    return normaliseEvent(data)
  },
  rejectEvent: async (eventId: number, reason?: string) => {
    const { data } = await api.patch(`/events/${eventId}/approval`, { action: 'reject', reason })
    return normaliseEvent(data)
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
    const { data } = await api.patch(`/lost-found/${id}/found`, { status: 'Found' })
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

// ── Admin Notifications ───────────────────────────────
export interface AdminNotification {
  id: number
  type: string
  title: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
}

export const notificationsAPI = {
  getAll: async (page = 1, unreadOnly = false): Promise<PaginatedResponse<AdminNotification> & { unread_count: number }> => {
    const { data } = await api.get('/admin/notifications', { params: { page, unread_only: unreadOnly || undefined } })
    return data
  },
  unreadCount: async (): Promise<number> => {
    const { data } = await api.get('/admin/notifications/unread-count')
    return data.unread_count
  },
  markRead: async (id: number) => {
    const { data } = await api.patch(`/admin/notifications/${id}/read`)
    return data
  },
  markAllRead: async () => {
    await api.patch('/admin/notifications/read-all')
  },
}

// ── Test data cleanup (development only) ──────────────
export const cleanupAPI = {
  preview: async (): Promise<{ count: number; users: { id: number; name: string; email: string }[] }> => {
    const { data } = await api.get('/admin/dev/test-accounts-preview')
    return data
  },
  run: async (): Promise<{ message: string; deleted: { id: number; email: string }[] }> => {
    const { data } = await api.post('/admin/dev/cleanup-test-data', { confirm: 'DELETE TEST DATA' })
    return data
  },
}
