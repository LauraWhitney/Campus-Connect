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
    // Backend expects snake_case field names
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      faculty: userData.faculty,
      year_of_study: userData.yearOfStudy,
    }
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  me: async (token: string): Promise<User> => {
    const { data } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    // /auth/me returns the User object directly (not wrapped in {user})
    return data
  },
}
