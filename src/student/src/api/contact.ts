import api from './index'

export const contactAPI = {
  submit: async (payload: { name: string; email: string; message: string }): Promise<{ message: string; email_sent: boolean }> => {
    const { data } = await api.post('/contact', payload)
    return data
  },
}
