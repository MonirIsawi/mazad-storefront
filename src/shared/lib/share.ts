export type ShareOutcome = 'shared' | 'dismissed' | 'copied' | 'unavailable';

type ShareNavigator = Pick<Navigator, 'clipboard'> & { share?: Navigator['share'] };

/**
 * Share a link with the system sheet where there is one (mobile, Safari, Edge/Chrome on Windows),
 * otherwise copy it: desktop Firefox has no `navigator.share`, and a share button that does
 * nothing there looks broken. A share the browser refuses (not the user closing the sheet) falls
 * back to copying too.
 */
export async function shareLink(
  url: string,
  nav: ShareNavigator = navigator,
): Promise<ShareOutcome> {
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed';
    }
  }
  try {
    await nav.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'unavailable';
  }
}
