import api from './index'
import type { MarketplaceItem, PaginatedResponse } from '../types'

export const marketplaceAPI = {
  getAll: async (page = 1, category?: string): Promise<PaginatedResponse<MarketplaceItem>> => {
    const params: Record<string, string | number> = { page }
    if (category) params.category = category
    const { data } = await api.get('/marketplace', { params })
    return data
  },

  getById: async (id: string): Promise<MarketplaceItem> => {
    const { data } = await api.get(`/marketplace/${id}`)
    return data.data
  },

  create: async (itemData: Partial<MarketplaceItem>): Promise<MarketplaceItem> => {
    const { data } = await api.post('/marketplace', itemData)
    return data.data
  },

  markSold: async (id: string): Promise<void> => {
    await api.patch(`/marketplace/${id}/sold`)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/marketplace/${id}`)
  },
}
