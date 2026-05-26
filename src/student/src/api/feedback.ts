import api from './index'
import type { Feedback, PaginatedResponse } from '../types'

function normalise(f: any): Feedback {
  return {
    ...f,
    _id: String(f.id),
    isAnonymous: f.is_anonymous,
    submittedBy: f.submitted_by ?? null,
    notified: f.notified ?? false,
    resolvedAt: f.resolved_at ?? null,
    createdAt: f.created_at,
  }
}

export const feedbackAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Feedback>> => {
    const { data } = await api.get('/feedback', { params: { page } })
    return { ...data, data: data.data.map(normalise) }
  },

  submit: async (feedbackData: Partial<Feedback>): Promise<Feedback> => {
    const { data } = await api.post('/feedback', feedbackData)
    return normalise(data)
  },

  updateStatus: async (id: string, status: string): Promise<Feedback> => {
    const { data } = await api.patch(`/feedback/${id}/status`, { status })
    return normalise(data)
  },
}
