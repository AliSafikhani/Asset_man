/**
 * useReportReady — resolves once the report DOM is safe to capture.
 * File: frontend/src/features/report/hooks/useReportReady.js
 *
 * Recharts paints SVG paths asynchronously; capturing too early yields a blank
 * chart. This gate awaits web fonts, two animation frames, and a short settle
 * delay before flipping `ready` true.
 */

import { useEffect, useState } from 'react';

const raf = () => new Promise((r) => requestAnimationFrame(r));

export default function useReportReady(deps = []) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* fonts API optional */
      }
      await raf();
      await raf();
      await new Promise((r) => setTimeout(r, 120));
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ready;
}
