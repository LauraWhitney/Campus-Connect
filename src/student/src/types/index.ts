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
export type EventCategory =
  | 'Academic' | 'Sports' | 'Cultural' | 'Spiritual'
  | 'Career' | 'Social' | 'Convocation' | 'Staff Development'

export interface EventAttendance {
  id: string
  eventId: string
  userId: string
  checkedIn: boolean
  checkedInAt?: string
  createdAt: string
}

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
  pendingRsvpCount?: number
  hasRsvped?: boolean
  pendingRsvp?: boolean
  isCreator?: boolean
  creatorName?: string | null
  createdBy?: string | number
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt: string
}

// ── Marketplace ───────────────────────────────────────
export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair'
export type ItemCategory =
  | 'Books' | 'Electronics' | 'Clothing' | 'Stationery'
  | 'Accommodation' | 'Notes/Handouts' | 'Lab Equipment' | 'Hostel Items' | 'Other'

export interface MarketplaceItem {
  _id: string
  title: string
  description: string
  price: number
  condition: ItemCondition
  category: ItemCategory
  images: string[]
  contact?: string | null
  seller: Pick<User, '_id' | 'name' | 'email'>
  buyer?: Pick<User, '_id' | 'name' | 'email'> | null
  isSold: boolean
  soldAt?: string | null
  createdAt: string
}

// ── Clubs ─────────────────────────────────────────────
export type ClubCategory =
  | 'Academic' | 'Sports' | 'Arts' | 'Catholic Ministry'
  | 'Technology' | 'Law Society' | 'Music & Performing Arts'
  | 'Community Service' | 'Science'

export interface Club {
  _id: string
  name: string
  description: string
  category: ClubCategory
  memberCount: number
  president: string
  email: string
  meetingSchedule?: string
  meetingLocation?: string
  isMember?: boolean
  hasPending?: boolean
  isOwner?: boolean
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
  reportedBy?: Pick<User, '_id' | 'name'> | null
  isClaimed: boolean
  claimedBy?: number | null
  claimer?: Pick<User, '_id' | 'name'> | null
  claimedAt?: string | null
  createdAt: string
}

// ── Feedback ──────────────────────────────────────────
export type FeedbackCategory =
  | 'Academic' | 'Facilities' | 'Administration'
  | 'Clubs' | 'Events' | 'Spiritual' | 'Hostel' | 'Other'

export interface Feedback {
  _id: string
  title: string
  description: string
  category: FeedbackCategory
  department: string
  isAnonymous: boolean
  status: 'Pending' | 'Reviewed' | 'Resolved'
  notified: boolean
  submittedBy?: Pick<User, '_id' | 'name'> | null
  resolvedAt?: string | null
  createdAt: string
}

// ── Notifications ─────────────────────────────────────
export type NotificationType = 'feedback' | 'event' | 'club' | 'lostfound' | 'contact' | 'system'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  message: string
  link?: string | null
  is_read: boolean
  created_at: string
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
