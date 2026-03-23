/**
 * Shared refs for the campus map feature.
 */

import { useMemo, useRef } from "react";

function createCampusMapRefs(refs) {
  return refs;
}

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
    () => createCampusMapRefs({ campusMarkers, homePointer, homePopup, map, mapContainer, routeLayerAdded, startMarker, startPopup }),
    [],
  );
}
