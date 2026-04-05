// ── Auth ──────────────────────────────────────────────
export type UserRole = 'student' | 'admin' | 'lecturer'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  faculty?: string
  yearOfStudy?: number
  avatar?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ── Events ────────────────────────────────────────────
export type EventCategory = 'Academic' | 'Sports' | 'Cultural' | 'Spiritual' | 'Career' | 'Social'

export interface Event {
  _id: string
  title: string
  description: string
  category: EventCategory
  date: string
  time: string
  venue: string
  organizer: string
  image?: string
  capacity?: number
  rsvpCount: number
  hasRsvped?: boolean
  createdBy: string
  createdAt: string
}

// ── Marketplace ───────────────────────────────────────
export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair'
export type ItemCategory = 'Books' | 'Electronics' | 'Clothing' | 'Stationery' | 'Accommodation' | 'Other'

export interface MarketplaceItem {
  _id: string
  title: string
  description: string
  price: number
  condition: ItemCondition
  category: ItemCategory
  images: string[]
  seller: Pick<User, '_id' | 'name' | 'email'>
  isSold: boolean
  createdAt: string
}

// ── Clubs ─────────────────────────────────────────────
export type ClubCategory = 'Academic' | 'Sports' | 'Arts' | 'Religious' | 'Technology' | 'Community'

export interface Club {
  _id: string
  name: string
  description: string
  category: ClubCategory
  memberCount: number
  president: string
  email: string
  meetingSchedule?: string
  isMember?: boolean
  logo?: string
  createdAt: string
}

// ── Lost & Found ──────────────────────────────────────
export type ItemStatus = 'Lost' | 'Found' | 'Claimed'

export interface LostFoundItem {
  _id: string
  title: string
  description: string
  status: ItemStatus
  location: string
  date: string
  image?: string
  contact: string
  reportedBy: Pick<User, '_id' | 'name'>
  isClaimed: boolean
  createdAt: string
}

// ── Feedback ──────────────────────────────────────────
export type FeedbackCategory = 'Academic' | 'Facilities' | 'Administration' | 'Clubs' | 'Events' | 'Other'

export interface Feedback {
  _id: string
  title: string
  description: string
  category: FeedbackCategory
  department: string
  isAnonymous: boolean
  status: 'Pending' | 'Reviewed' | 'Resolved'
  submittedBy?: Pick<User, '_id' | 'name'>
  createdAt: string
}

// ── API responses ─────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  pages: number
}
