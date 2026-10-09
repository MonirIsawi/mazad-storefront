import { describe, expect, it, vi } from 'vitest';
import { shareLink } from './share';

const URL_ = 'https://mazad.test/auctions/a1';
const clipboard = (ok = true) => ({
  writeText: vi.fn(() => (ok ? Promise.resolve() : Promise.reject(new Error('denied')))),
});

describe('shareLink', () => {
  it('uses the system share sheet when there is one', async () => {
    const nav = { share: vi.fn(() => Promise.resolve()), clipboard: clipboard() };
    expect(await shareLink(URL_, nav as never)).toBe('shared');
    expect(nav.share).toHaveBeenCalledWith({ url: URL_ });
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies the link where there is no share sheet (desktop Firefox)', async () => {
    const nav = { clipboard: clipboard() };
    expect(await shareLink(URL_, nav as never)).toBe('copied');
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(URL_);
  });

  it('treats closing the sheet as a choice, not a failure', async () => {
    const nav = {
      share: vi.fn(() => Promise.reject(new DOMException('closed', 'AbortError'))),
      clipboard: clipboard(),
    };
    expect(await shareLink(URL_, nav as never)).toBe('dismissed');
    expect(nav.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies instead when the browser refuses to share', async () => {
    const nav = {
      share: vi.fn(() => Promise.reject(new DOMException('no', 'NotAllowedError'))),
      clipboard: clipboard(),
    };
    expect(await shareLink(URL_, nav as never)).toBe('copied');
  });

  it('reports when neither works', async () => {
    expect(await shareLink(URL_, { clipboard: clipboard(false) } as never)).toBe('unavailable');
  });
});
