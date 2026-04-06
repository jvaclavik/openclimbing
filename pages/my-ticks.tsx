import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useOsmAuthContext } from '../src/components/utils/OsmAuthContext';
import { profilePathForOsmDisplayName } from '../src/services/my-ticks/profilePaths';

/**
 * Legacy URL: přesměruje na lezecký profil přihlášeného uživatele.
 */
export default function LegacyMyTicksRedirect() {
  const router = useRouter();
  const { loggedIn, osmUser } = useOsmAuthContext();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (loggedIn && osmUser) {
      void router.replace(profilePathForOsmDisplayName(osmUser));
    } else {
      void router.replace('/');
    }
  }, [router, loggedIn, osmUser]);

  return null;
}
