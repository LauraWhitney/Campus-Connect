import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, AuthState } from '../types'
import { authAPI } from '../api/auth'
import toast from 'react-hot-toast'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  loading: boolean
}

interface RegisterData {
  name: string
  email: string
  password: string
  faculty?: string
  yearOfStudy?: number
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('cc_token'),
    isAuthenticated: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('cc_token')
    if (token) {
      authAPI.me(token)
        .then((user: User) => setState({ user, token, isAuthenticated: true }))
        .catch(() => {
          localStorage.removeItem('cc_token')
          setState({ user: null, token: null, isAuthenticated: false })
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user, token } = await authAPI.login(email, password)
    localStorage.setItem('cc_token', token)
    setState({ user, token, isAuthenticated: true })
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
  }

  const register = async (data: RegisterData) => {
    const { user, token } = await authAPI.register(data)
    localStorage.setItem('cc_token', token)
    setState({ user, token, isAuthenticated: true })
    toast.success(`Welcome to Campus Connect, ${user.name.split(' ')[0]}!`)
  }

  const logout = () => {
    localStorage.removeItem('cc_token')
    setState({ user: null, token: null, isAuthenticated: false })
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
