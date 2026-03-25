/**
 * Shared refs for the campus map feature.
 */

import { useMemo, useRef } from "react";

export function useCampusMapRefs() {
  const campusMarkers = useRef([]);
  const homePointer = useRef(null);
  const homePopup = useRef(null);
  const map = useRef(null);
  const mapContainer = useRef(null);
  const routeLayerAdded = useRef(false);
  const startMarker = useRef(null);
  const startPopup = useRef(null);

  return useMemo(
    () => ({ campusMarkers, homePointer, homePopup, map, mapContainer, routeLayerAdded, startMarker, startPopup }),
    [],
  );
}
