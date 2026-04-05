import api from './index'
import type { User } from '../types'

export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  register: async (userData: {
    name: string
    email: string
    password: string
    faculty?: string
    yearOfStudy?: number
  }): Promise<{ user: User; token: string }> => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  me: async (token: string): Promise<User> => {
    const { data } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data.user
  },
}
