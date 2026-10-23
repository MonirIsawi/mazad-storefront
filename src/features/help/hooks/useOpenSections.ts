'use client';

import { useCallback, useEffect, useState } from 'react';

/** The section the address points at (`#prohibited-items`), when it is one of these. */
function targetedSection(ids: string[]): string | null {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return ids.includes(hash) ? hash : null;
}

/**
 * Which folded sections are open: the first one to begin with, plus the one the address points
 * at, which is opened and scrolled to (on arrival and whenever the hash changes).
 */
export function useOpenSections(ids: string[]) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(ids.slice(0, 1)));
  const idsKey = ids.join(' ');

  useEffect(() => {
    const sectionIds = idsKey.split(' ');
    const reveal = () => {
      const target = targetedSection(sectionIds);
      if (!target) return;
      setOpen((current) => new Set(current).add(target));
      // After the panel is shown, so the scroll lands on the opened clause.
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView());
    };
    reveal();
    window.addEventListener('hashchange', reveal);
    return () => window.removeEventListener('hashchange', reveal);
  }, [idsKey]);

  const toggle = useCallback((id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { isOpen: (id: string) => open.has(id), toggle };
}
