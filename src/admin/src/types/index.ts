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
  creator?: { id: number; name: string; email: string } | null
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  reviewed_by?: number | null
  reviewer_name?: string | null
  reviewed_at?: string | null
  created_at: string
}

export interface MarketplaceItem {
  id: number
  title: string
  description: string
  price: number
  condition: string
  category: string
  images: string[]
  contact?: string | null
  seller: { id: number; name: string; email: string }
  buyer?: { id: number; name: string; email: string } | null
  seller_id: number
  is_sold: boolean
  sold_at?: string | null
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
  meeting_location?: string
  registration_number?: string
  member_count: number
  created_by?: number
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  reviewed_by?: number | null
  reviewer_name?: string | null
  reviewed_at?: string | null
  created_at: string
}

export interface ApprovalHistoryEntry {
  id: number
  action: 'approve' | 'reject'
  previous_status: string
  new_status: string
  reason?: string | null
  reviewed_by?: string | null
  reviewed_at: string
}

export interface LostFoundItem {
  id: number
  title: string
  description: string
  status: 'Lost' | 'Found' | 'Claimed'
  location: string
  date: string
  image?: string
  contact: string
  reporter?: { id: number; name: string } | null
  reported_by?: number | null
  is_claimed: boolean
  claimed_by?: number | null
  claimer?: { id: number; name: string } | null
  claimed_at?: string | null
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
  notified: boolean
  submitted_by?: { id: number; name: string } | null
  submitter?: { id: number; name: string } | null
  resolved_by?: number | null
  resolved_at?: string | null
  created_at: string
}

export interface AdminAuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

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

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pages: number
  page_size: number
}

export interface ActivityLog {
  id: number
  user_id?: number
  user_email?: string
  action: string
  detail?: string
  ip_address?: string
  created_at: string
}
