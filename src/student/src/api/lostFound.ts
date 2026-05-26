import api from './index'
import type { LostFoundItem, PaginatedResponse } from '../types'

function normalise(i: any): LostFoundItem {
  return {
    ...i,
    _id: String(i.id),
    isClaimed: i.is_claimed,
    claimedBy: i.claimed_by ?? null,
    claimer: i.claimer ?? null,
    claimedAt: i.claimed_at ?? null,
    reportedBy: i.reporter ?? null,
    createdAt: i.created_at,
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

  /** Claim an item — records who claimed it and sets status → Claimed */
  claim: async (id: string): Promise<LostFoundItem> => {
    const { data } = await api.patch(`/lost-found/${id}/claim`)
    return normalise(data)
  },

  /** Update a Lost item to Found status */
  markFound: async (id: string): Promise<LostFoundItem> => {
    const { data } = await api.patch(`/lost-found/${id}/found`)
    return normalise(data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/lost-found/${id}`)
  },
}
