import { ROUTES } from '@shared/constants';

/**
 * Hard navigation to the login screen after the session is gone. Its own module so the
 * http-client tests can observe it — jsdom cannot perform a real navigation.
 */
export function redirectToLogin(): void {
  if (typeof window !== 'undefined') window.location.assign(ROUTES.login);
}
