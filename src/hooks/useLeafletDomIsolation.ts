import { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * Prevents click, double-click, and wheel scroll inside floating map HUD overlays
 * from propagating into the underlying Leaflet canvas.
 */
export function useLeafletDomIsolation<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    } catch {
      // Safe fallback in non-browser/test environments
    }
  }, []);

  return ref;
}

