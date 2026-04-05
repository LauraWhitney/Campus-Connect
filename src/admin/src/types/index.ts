// ── Shared base types ─────────────────────────────────
export type UserRole = 'student' | 'admin' | 'lecturer'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  faculty?: string
  year_of_study?: number
  created_at: string
}

export interface Event {
  id: number
  title: string
  description: string
  category: string
  date: string
  time: string
  venue: string
  organizer: string
  capacity?: number
  rsvp_count: number
  created_by?: number
  created_at: string
}

export interface MarketplaceItem {
  id: number
  title: string
  description: string
  price: number
  condition: string
  category: string
  seller: { id: number; name: string; email: string }
  is_sold: boolean
  created_at: string
}

export interface Club {
  id: number
  name: string
  description: string
  category: string
  president: string
  email: string
  meeting_schedule?: string
  member_count: number
  created_at: string
}

export interface LostFoundItem {
  id: number
  title: string
  description: string
  status: 'Lost' | 'Found' | 'Claimed'
  location: string
  date: string
  contact: string
  reporter?: { id: number; name: string }
  is_claimed: boolean
  created_at: string
}

export interface Feedback {
  id: number
  title: string
  description: string
  category: string
  department: string
  is_anonymous: boolean
  status: 'Pending' | 'Reviewed' | 'Resolved'
  submitted_by?: { id: number; name: string }
  created_at: string
}

// ── Admin auth ────────────────────────────────────────
export interface AdminAuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ── Stats ─────────────────────────────────────────────
export interface DashboardStats {
  total_users: number
  total_events: number
  total_marketplace_items: number
  total_clubs: number
  total_lost_found: number
  total_feedback: number
  pending_feedback: number
  recent_users: User[]
}

// ── API ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pages: number
  page_size: number
}
