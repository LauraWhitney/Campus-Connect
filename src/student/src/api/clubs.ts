import api from './index'
import type { Club, PaginatedResponse } from '../types'

function normalise(c: any): Club {
  return {
    ...c,
    _id: String(c.id),
    memberCount: c.member_count ?? 0,
    isMember: c.is_member ?? false,
    hasPending: c.has_pending ?? false,
    isOwner: c.is_owner ?? false,
    meetingSchedule: c.meeting_schedule,
    meetingLocation: c.meeting_location,
  }
}

export const clubsAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Club>> => {
    const { data } = await api.get('/clubs', { params: { page } })
    return { ...data, data: data.data.map(normalise) }
  },

  getOne: async (id: string): Promise<Club> => {
    const { data } = await api.get(`/clubs/${id}`)
    return normalise(data)
  },

  /** Submit a join request with membership form data (university email is taken from the account, not the form) */
  join: async (id: string, formData?: {
    course: string
    year_of_study: number
    full_name: string
    phone_number: string
  }) => {
    const { data } = await api.post(`/clubs/${id}/join`, formData ?? {})
    return data   // { action, member_count }
  },

  /** Get membership requests (owner only) */
  getMembers: async (id: string) => {
    const { data } = await api.get(`/clubs/${id}/members`)
    return data
  },

  /** Approve or reject a membership request (owner only) */
  manageMember: async (clubId: string, requestId: number, action: 'approve' | 'reject') => {
    const { data } = await api.patch(`/clubs/${clubId}/members/${requestId}`, { action })
    return data
  },

  create: async (clubData: Partial<Club>): Promise<Club> => {
    const { data } = await api.post('/clubs', clubData)
    return normalise(data)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clubs/${id}`)
  },
}
