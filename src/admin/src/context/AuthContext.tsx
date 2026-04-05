import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, AdminAuthState } from '../types'
import { authAPI } from '../api/admin'
import toast from 'react-hot-toast'

interface AdminAuthContextType extends AdminAuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    token: localStorage.getItem('cc_admin_token'),
    isAuthenticated: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cc_admin_token')
    if (token) {
      authAPI.me(token)
        .then((user: User) => {
          if (user.role !== 'admin') throw new Error('Not admin')
          setState({ user, token, isAuthenticated: true })
        })
        .catch(() => {
          localStorage.removeItem('cc_admin_token')
          setState({ user: null, token: null, isAuthenticated: false })
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user, token } = await authAPI.login(email, password)
    localStorage.setItem('cc_admin_token', token)
    setState({ user, token, isAuthenticated: true })
    toast.success(`Welcome, ${user.name.split(' ')[0]}`)
  }

  const logout = () => {
    localStorage.removeItem('cc_admin_token')
    setState({ user: null, token: null, isAuthenticated: false })
    toast.success('Signed out')
  }

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider')
  return ctx
}
