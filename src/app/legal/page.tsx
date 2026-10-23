import { permanentRedirect } from 'next/navigation';
import { ROUTES } from '@shared/constants';

/*
 * The design's /legal addresses. The canonical pages stay /help/terms and /help/privacy: the auth
 * screens, the footer, the Android app and the store listing already link there.
 */
export default function Page() {
  permanentRedirect(ROUTES.helpTopic('terms'));
}
