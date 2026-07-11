import api from './index'
import type { Event, EventAttendance, PaginatedResponse } from '../types'

function normalise(e: any): Event {
  return {
    ...e,
    _id: String(e.id),
    rsvpCount: e.rsvp_count ?? 0,
    pendingRsvpCount: e.pending_rsvp_count ?? 0,
    hasRsvped: e.has_rsvped ?? false,
    pendingRsvp: e.pending_rsvp ?? false,
    isCreator: e.is_creator ?? false,
    creatorName: e.creator_name ?? null,
    createdBy: e.created_by,
    approvalStatus: e.approval_status ?? 'approved',
    rejectionReason: e.rejection_reason ?? null,
    createdAt: e.created_at,
  }
}

function normaliseAttendance(a: any): EventAttendance {
  return {
    ...a,
    id: String(a.id),
    eventId: String(a.event_id),
    userId: String(a.user_id),
    checkedIn: a.checked_in,
    checkedInAt: a.checked_in_at,
    createdAt: a.created_at,
  }
}

export const eventsAPI = {
  getAll: async (page = 1, category?: string): Promise<PaginatedResponse<Event>> => {
    const params: Record<string, string | number> = { page }
    if (category) params.category = category
    const { data } = await api.get('/events', { params })
    return { ...data, data: data.data.map(normalise) }
  },

  getOne: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/events/${id}`)
    return normalise(data)
  },

  create: async (eventData: Partial<Event>): Promise<Event> => {
    const { data } = await api.post('/events', eventData)
    return normalise(data)
  },

  /** Edit an event. If it had been rejected, this automatically resubmits it for review. */
  update: async (id: string, eventData: Partial<Event>): Promise<Event> => {
    const { data } = await api.put(`/events/${id}`, eventData)
    return normalise(data)
  },

  /** Toggle RSVP: pending → cancelled, or new request */
  rsvp: async (id: string) => {
    const { data } = await api.post(`/events/${id}/rsvp`)
    return data // { action, rsvp_count }
  },

  /** Get RSVP requests for an event (creator only) */
  getRsvps: async (id: string) => {
    const { data } = await api.get(`/events/${id}/rsvps`)
    return data
  },

  /** Approve or reject an RSVP request (creator only) */
  manageRsvp: async (eventId: string, rsvpId: number, action: 'approve' | 'reject') => {
    const { data } = await api.patch(`/events/${eventId}/rsvps/${rsvpId}`, { action })
    return data
  },

  /** Confirm physical attendance */
  checkIn: async (id: string): Promise<EventAttendance> => {
    const { data } = await api.post(`/events/${id}/checkin`)
    return normaliseAttendance(data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`)
  },
}
