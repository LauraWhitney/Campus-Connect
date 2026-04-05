import api from './index'
import type { Club, PaginatedResponse } from '../types'

export const clubsAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Club>> => {
    const { data } = await api.get('/clubs', { params: { page } })
    return data
  },

  getById: async (id: string): Promise<Club> => {
    const { data } = await api.get(`/clubs/${id}`)
    return data.data
  },

  join: async (id: string): Promise<{ memberCount: number }> => {
    const { data } = await api.post(`/clubs/${id}/join`)
    return data
  },

  create: async (clubData: Partial<Club>): Promise<Club> => {
    const { data } = await api.post('/clubs', clubData)
    return data.data
  },
}
