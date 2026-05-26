import api from './index'
import type { Event, EventAttendance, PaginatedResponse } from '../types'

function normalise(e: any): Event {
  return {
    ...e,
    _id: String(e.id),
    rsvpCount: e.rsvp_count,
    hasRsvped: e.has_rsvped,
    createdBy: e.created_by,
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

  rsvp: async (id: string) => {
    const { data } = await api.post(`/events/${id}/rsvp`)
    return data // { action, rsvp_count }
  },

  /** Confirm physical attendance — must have RSVP'd first */
  checkIn: async (id: string): Promise<EventAttendance> => {
    const { data } = await api.post(`/events/${id}/checkin`)
    return normaliseAttendance(data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`)
  },
}
