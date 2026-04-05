import api from './index'
import type { Feedback, PaginatedResponse } from '../types'

export const feedbackAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<Feedback>> => {
    const { data } = await api.get('/feedback', { params: { page } })
    return data
  },

  submit: async (feedbackData: Partial<Feedback>): Promise<Feedback> => {
    const { data } = await api.post('/feedback', feedbackData)
    return data.data
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(`/feedback/${id}/status`, { status })
  },
}
