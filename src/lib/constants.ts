/**
 * Centralized constants for roles and member stages
 *
 * Use these constants instead of hardcoded strings throughout the codebase.
 * This ensures type safety and makes refactoring easier.
 */

// User roles in the system (hierarchy: PASTOR > DISCIPULADOR > LEADER > MEMBER)
// Note: Must match the CHECK constraint in profiles table
export const ROLES = {
  PASTOR: 'PASTOR',
  DISCIPULADOR: 'DISCIPULADOR',
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// Member stages (spiritual journey progression)
export const MEMBER_STAGES = {
  VISITOR: 'VISITOR',
  REGULAR_VISITOR: 'REGULAR_VISITOR',
  MEMBER: 'MEMBER',
  GUARDIAN_ANGEL: 'GUARDIAN_ANGEL',
  TRAINING_LEADER: 'TRAINING_LEADER',
  LEADER: 'LEADER',
  PASTOR: 'PASTOR',
} as const

export type MemberStage = typeof MEMBER_STAGES[keyof typeof MEMBER_STAGES]

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
} as const

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS]

// Cell meeting statuses
export const MEETING_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
} as const

export type MeetingStatus = typeof MEETING_STATUS[keyof typeof MEETING_STATUS]

// Attendance statuses
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  JUSTIFIED: 'JUSTIFIED',
} as const

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS]

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELED: 'CANCELED',
  REFUNDED: 'REFUNDED',
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

// Tithe statuses
export const TITHE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
} as const

export type TitheStatus = typeof TITHE_STATUS[keyof typeof TITHE_STATUS]

// LGPD deletion request statuses
export const DELETION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const

export type DeletionStatus = typeof DELETION_STATUS[keyof typeof DELETION_STATUS]

// Helper functions for role checks
export function isPastor(role: string | undefined): boolean {
  return role === ROLES.PASTOR
}

export function isDiscipulador(role: string | undefined): boolean {
  return role === ROLES.DISCIPULADOR
}

export function isLeader(role: string | undefined): boolean {
  return role === ROLES.LEADER
}

export function isPastorOrDiscipulador(role: string | undefined): boolean {
  return role === ROLES.PASTOR || role === ROLES.DISCIPULADOR
}

export function isPastorOrLeader(role: string | undefined): boolean {
  return role === ROLES.PASTOR || role === ROLES.LEADER
}

export function hasSupervisionAccess(role: string | undefined): boolean {
  return role === ROLES.PASTOR || role === ROLES.DISCIPULADOR
}

export function hasAdminAccess(role: string | undefined): boolean {
  return role === ROLES.PASTOR
}

// Discipulador constants
export const MAX_CELLS_PER_DISCIPULADOR = 5
export const MIN_ATTENDANCE_THRESHOLD = 60
export const MAX_NOTE_LENGTH = 2000
