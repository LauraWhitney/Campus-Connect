import api from './index'
import type { AppNotification, PaginatedResponse } from '../types'

export const notificationsAPI = {
  getAll: async (page = 1): Promise<PaginatedResponse<AppNotification> & { unread_count: number }> => {
    const { data } = await api.get('/notifications', { params: { page } })
    return data
  },
  unreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications/unread-count')
    return data.unread_count
  },
  markRead: async (id: number): Promise<AppNotification> => {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data
  },
  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all')
  },
}
