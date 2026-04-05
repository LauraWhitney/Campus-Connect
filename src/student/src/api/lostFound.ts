import api from './index'
import type { LostFoundItem, PaginatedResponse } from '../types'

export const lostFoundAPI = {
  getAll: async (page = 1, status?: string): Promise<PaginatedResponse<LostFoundItem>> => {
    const params: Record<string, string | number> = { page }
    if (status) params.status = status
    const { data } = await api.get('/lost-found', { params })
    return data
  },

  create: async (itemData: Partial<LostFoundItem>): Promise<LostFoundItem> => {
    const { data } = await api.post('/lost-found', itemData)
    return data.data
  },

  markClaimed: async (id: string): Promise<void> => {
    await api.patch(`/lost-found/${id}/claimed`)
  },
}
