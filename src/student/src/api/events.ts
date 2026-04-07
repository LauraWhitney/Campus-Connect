import api from './index'
import type { Event, PaginatedResponse } from '../types'

// Backend uses integer "id", frontend type uses "_id" string.
// We normalise here so the rest of the app stays unchanged.
function normalise(e: any): Event {
  return { ...e, _id: String(e.id), rsvpCount: e.rsvp_count, hasRsvped: e.has_rsvped }
}

export const eventsAPI = {
  getAll: async (page = 1, category?: string): Promise<PaginatedResponse<Event>> => {
    const params: Record<string, string | number> = { page }
    if (category) params.category = category
    const { data } = await api.get('/events', { params })
    return { ...data, data: data.data.map(normalise) }
  },

  create: async (eventData: Partial<Event>): Promise<Event> => {
    const { data } = await api.post('/events', eventData)
    return normalise(data)
  },

  // id here is already the normalised string "_id" from the card
  rsvp: async (id: string) => {
    const { data } = await api.post(`/events/${id}/rsvp`)
    return data   // { action, rsvp_count }
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`)
  },
}