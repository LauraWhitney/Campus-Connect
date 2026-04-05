import api from './index'
import type { Event, ApiResponse, PaginatedResponse } from '../types'

export const eventsAPI = {
  getAll: async (page = 1, category?: string): Promise<PaginatedResponse<Event>> => {
    const params: Record<string, string | number> = { page }
    if (category) params.category = category
    const { data } = await api.get('/events', { params })
    return data
  },

  getById: async (id: string): Promise<Event> => {
    const { data } = await api.get(`/events/${id}`)
    return data.data
  },

  create: async (eventData: Partial<Event>): Promise<Event> => {
    const { data } = await api.post('/events', eventData)
    return data.data
  },

  rsvp: async (id: string): Promise<ApiResponse<{ rsvpCount: number }>> => {
    const { data } = await api.post(`/events/${id}/rsvp`)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`)
  },
}
