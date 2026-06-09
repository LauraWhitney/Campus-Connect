import api from './index'
import type { User } from '../types'

function normaliseUser(u: any): User {
  return {
    ...u,
    _id: String(u.id),
    yearOfStudy: u.year_of_study ?? null,
    createdAt: u.created_at,
  }
}

export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const { data } = await api.post('/auth/login', { email, password })
    return { user: normaliseUser(data.user), token: data.token }
  },

  register: async (userData: {
    name: string
    email: string
    password: string
    faculty?: string
    yearOfStudy?: number
  }): Promise<{ user: User; token: string }> => {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      faculty: userData.faculty,
      year_of_study: userData.yearOfStudy,
    }
    const { data } = await api.post('/auth/register', payload)
    return { user: normaliseUser(data.user), token: data.token }
  },

  me: async (token: string): Promise<User> => {
    const { data } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return normaliseUser(data)
  },
}
