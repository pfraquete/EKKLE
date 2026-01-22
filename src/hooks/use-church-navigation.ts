'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for navigation in church sites that handles the /site/[domain] prefix automatically.
 *
 * When on a church subdomain (e.g., verbo.ekkle.com.br), the middleware rewrites URLs
 * to /site/[domain]/... pattern. This hook ensures client-side navigation works correctly.
 *
 * @example
 * const { push } = useChurchNavigation();
 * push('/membro/loja/checkout'); // Will navigate to /site/[domain]/membro/loja/checkout
 */
export function useChurchNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract the church domain prefix if we're in a church site context
  const getChurchPrefix = useCallback(() => {
    // Check if we're in a /site/[domain] context
    const match = pathname.match(/^\/site\/([^\/]+)/);
    return match ? `/site/${match[1]}` : '';
  }, [pathname]);

  // Navigation function that adds the church prefix if needed
  const push = useCallback((path: string) => {
    const prefix = getChurchPrefix();

    // If path starts with / and we have a church prefix, prepend it
    if (path.startsWith('/') && prefix) {
      router.push(`${prefix}${path}`);
    } else {
      router.push(path);
    }
  }, [router, getChurchPrefix]);

  const replace = useCallback((path: string) => {
    const prefix = getChurchPrefix();

    if (path.startsWith('/') && prefix) {
      router.replace(`${prefix}${path}`);
    } else {
      router.replace(path);
    }
  }, [router, getChurchPrefix]);

  return {
    push,
    replace,
    router, // Original router for advanced use cases
    churchPrefix: getChurchPrefix(),
  };
}
