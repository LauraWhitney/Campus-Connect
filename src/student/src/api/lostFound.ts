import api from './index'
import type { LostFoundItem, PaginatedResponse } from '../types'

function normalise(i: any): LostFoundItem {
  return {
    ...i,
    _id: String(i.id),
    isClaimed: i.is_claimed,
    reportedBy: i.reporter,
  }
}

export const lostFoundAPI = {
  getAll: async (page = 1, status?: string): Promise<PaginatedResponse<LostFoundItem>> => {
    const params: Record<string, string | number> = { page }
    if (status) params.status = status
    const { data } = await api.get('/lost-found', { params })
    return { ...data, data: data.data.map(normalise) }
  },

  create: async (itemData: Partial<LostFoundItem>): Promise<LostFoundItem> => {
    const { data } = await api.post('/lost-found', itemData)
    return normalise(data)
  },

  markClaimed: async (id: string): Promise<void> => {
    await api.patch(`/lost-found/${id}/claimed`)
  },
}