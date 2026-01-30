/**
 * Ekkle Hub Utilities
 *
 * The Ekkle Hub is a special "church" entity that holds users
 * who haven't affiliated with any real church yet. These utilities
 * help identify and manage Ekkle Hub users throughout the system.
 */

// Well-known UUID for the Ekkle Hub entity
// This UUID is reserved and should never be used for actual churches
export const EKKLE_HUB_ID = '00000000-0000-0000-0000-000000000001'

// Type for profile with church_id
interface ProfileWithChurch {
  church_id: string | null
}

/**
 * Check if a user belongs to the Ekkle Hub (unaffiliated)
 * @param profile - Profile object with church_id
 * @returns true if user is in Ekkle Hub, false otherwise
 */
export function isEkkleHubUser(profile: ProfileWithChurch | null | undefined): boolean {
  if (!profile || !profile.church_id) return false
  return profile.church_id === EKKLE_HUB_ID
}

/**
 * Check if a user is affiliated with a real church
 * @param profile - Profile object with church_id
 * @returns true if user has a real church, false if in Ekkle Hub or no profile
 */
export function hasChurchAffiliation(profile: ProfileWithChurch | null | undefined): boolean {
  if (!profile || !profile.church_id) return false
  return profile.church_id !== EKKLE_HUB_ID
}

/**
 * Get the redirect path based on user's church affiliation
 * @param profile - Profile object with church_id
 * @returns The appropriate member area path
 */
export function getMemberAreaPath(profile: ProfileWithChurch | null | undefined): string {
  if (isEkkleHubUser(profile)) {
    return '/ekkle/membro'
  }
  return '/membro'
}

/**
 * Check if a church_id represents the Ekkle Hub
 * @param churchId - Church ID to check
 * @returns true if it's the Ekkle Hub ID
 */
export function isEkkleHubId(churchId: string | null | undefined): boolean {
  return churchId === EKKLE_HUB_ID
}
