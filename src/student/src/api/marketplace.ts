import api from './index'
import type { MarketplaceItem, PaginatedResponse } from '../types'

function normalise(i: any): MarketplaceItem {
  return {
    ...i,
    _id: String(i.id),
    isSold: i.is_sold,
    soldAt: i.sold_at ?? null,
    buyer: i.buyer ? { ...i.buyer, _id: String(i.buyer.id) } : null,
    seller: i.seller ? { ...i.seller, _id: String(i.seller.id) } : i.seller,
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

  create: async (itemData: {
    title: string
    description: string
    price: number
    condition: string
    category: string
    images?: string[]
    contact?: string
  }): Promise<MarketplaceItem> => {
    const { data } = await api.post('/marketplace', itemData)
    return normalise(data)
  },

  /** Mark item as sold. */
  markSold: async (id: string, buyerId?: number): Promise<MarketplaceItem> => {
    const { data } = await api.patch(`/marketplace/${id}/sold`, buyerId ? { buyer_id: buyerId } : {})
    return normalise(data)
  },

  /** Revert sold status */
  markUnsold: async (id: string): Promise<MarketplaceItem> => {
    const { data } = await api.patch(`/marketplace/${id}/unsold`)
    return normalise(data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/marketplace/${id}`)
  },
}

/** Upload an image file to the server. Returns the URL. */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const token = localStorage.getItem('cc_token')
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Upload failed')
  }
  const json = await res.json()
  return json.url
}
