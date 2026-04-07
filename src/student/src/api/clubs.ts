import api from './index'
import type { Club, PaginatedResponse } from '../types'

function normalise(c: any): Club {
  return {
    ...c,
    _id: String(c.id),
    memberCount: c.member_count,
    isMember: c.is_member,
    meetingSchedule: c.meeting_schedule,
  }
}

export const clubsAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Club>> => {
    const { data } = await api.get('/clubs', { params: { page } })
    return { ...data, data: data.data.map(normalise) }
  },

  join: async (id: string) => {
    const { data } = await api.post(`/clubs/${id}/join`)
    return data   // { action, member_count }
  },

  create: async (clubData: Partial<Club>): Promise<Club> => {
    const { data } = await api.post('/clubs', clubData)
    return normalise(data)
  },
}