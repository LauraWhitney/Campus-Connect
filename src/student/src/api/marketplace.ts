import api from './index'
import type { MarketplaceItem, PaginatedResponse } from '../types'

function normalise(i: any): MarketplaceItem {
  return {
    ...i,
    _id: String(i.id),
    isSold: i.is_sold,
    soldAt: i.sold_at ?? null,
    buyer: i.buyer ?? null,
    createdAt: i.created_at,
  }
}

export const marketplaceAPI = {
  getAll: async (page = 1, category?: string, sold?: boolean): Promise<PaginatedResponse<MarketplaceItem>> => {
    const params: Record<string, string | number | boolean> = { page }
    if (category) params.category = category
    if (sold !== undefined) params.sold = sold
    const { data } = await api.get('/marketplace', { params })
    return { ...data, data: data.data.map(normalise) }
  },

  getOne: async (id: string): Promise<MarketplaceItem> => {
    const { data } = await api.get(`/marketplace/${id}`)
    return normalise(data)
  },

  create: async (itemData: Partial<MarketplaceItem>): Promise<MarketplaceItem> => {
    const { data } = await api.post('/marketplace', itemData)
    return normalise(data)
  },

  /** Mark item as sold. Pass optional buyerId if the buyer is a CUEA student. */
  markSold: async (id: string, buyerId?: number): Promise<MarketplaceItem> => {
    const { data } = await api.patch(`/marketplace/${id}/sold`, buyerId ? { buyer_id: buyerId } : {})
    return normalise(data)
  },

  /** Revert sold status (e.g. deal fell through) */
  markUnsold: async (id: string): Promise<MarketplaceItem> => {
    const { data } = await api.patch(`/marketplace/${id}/unsold`)
    return normalise(data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/marketplace/${id}`)
  },
}
