'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * A swipeable photo track (scroll snapping does the swipe): the current photo follows the scroll,
 * and going to a photo scrolls there. Scroll positions run negative in RTL; the index is the same.
 */
export function useGalleryTrack(total: number, startAt = 0) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startAt);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
    setIndex(Math.min(total - 1, Math.max(0, next)));
  }, [total]);

  const goTo = useCallback(
    (target: number, behavior: ScrollBehavior = 'smooth') => {
      const next = (target + total) % total;
      setIndex(next);
      const track = trackRef.current;
      if (!track || typeof track.scrollTo !== 'function') return;
      const isRtl = getComputedStyle(track).direction === 'rtl';
      track.scrollTo({ left: next * track.clientWidth * (isRtl ? -1 : 1), behavior });
    },
    [total],
  );

  return { trackRef, index, goTo, handleScroll };
}
