import api from './index'
import type { MarketplaceItem, PaginatedResponse } from '../types'

function normalise(i: any): MarketplaceItem {
  return { ...i, _id: String(i.id), isSold: i.is_sold }
}

export const marketplaceAPI = {
  getAll: async (page = 1, category?: string): Promise<PaginatedResponse<MarketplaceItem>> => {
    const params: Record<string, string | number> = { page }
    if (category) params.category = category
    const { data } = await api.get('/marketplace', { params })
    return { ...data, data: data.data.map(normalise) }
  },

  create: async (itemData: Partial<MarketplaceItem>): Promise<MarketplaceItem> => {
    const { data } = await api.post('/marketplace', itemData)
    return normalise(data)
  },

  markSold: async (id: string): Promise<void> => {
    await api.patch(`/marketplace/${id}/sold`)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/marketplace/${id}`)
  },
}