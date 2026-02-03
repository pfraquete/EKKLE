'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if a media query matches
 * @param query - The media query to match (e.g., "(min-width: 1024px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        // Check if window is defined (client-side)
        if (typeof window === 'undefined') {
            return
        }

        const mediaQuery = window.matchMedia(query)

        // Set initial value
        setMatches(mediaQuery.matches)

        // Handler for changes
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches)
        }

        // Add listener
        mediaQuery.addEventListener('change', handler)

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', handler)
        }
    }, [query])

    return matches
}

/**
 * Hook to detect if screen is desktop size (lg breakpoint: 1024px)
 * @returns boolean indicating if screen is desktop size
 */
export function useIsDesktop(): boolean {
    return useMediaQuery('(min-width: 1024px)')
}

/**
 * Hook to detect if screen is mobile size (below lg breakpoint)
 * @returns boolean indicating if screen is mobile size
 */
export function useIsMobile(): boolean {
    return useMediaQuery('(max-width: 1023px)')
}

/**
 * Hook to detect if screen is tablet size (md to lg)
 * @returns boolean indicating if screen is tablet size
 */
export function useIsTablet(): boolean {
    return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

/**
 * Hook to detect if user prefers reduced motion
 * @returns boolean indicating if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)')
}
