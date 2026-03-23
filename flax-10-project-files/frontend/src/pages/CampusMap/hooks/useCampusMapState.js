/**
 * Campus map state groups.
 */

import { useState } from "react";

const INITIAL_SELECTION = { customDestination: null, selectedCampus: null, startLocation: null };
const INITIAL_ROUTES = { loadingRoute: false, loadingTflRoute: false, routeError: "", routeInfo: null, tflRouteError: "", tflRouteInfo: null };
const INITIAL_FORM = { manualDestination: "", manualStart: "" };
const INITIAL_UI = { isMobile: window.innerWidth < 900, locating: false, mapLoaded: false, minSkeletonElapsed: false, mobileInitialOpen: true, tflInstructions: false, walkingInstructions: false };

export function useCampusMapState() {
  const [selection, setSelection] = useState(INITIAL_SELECTION);
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [form, setForm] = useState(INITIAL_FORM);
  const [ui, setUi] = useState(INITIAL_UI);

  return { form, routes, selection, setForm, setRoutes, setSelection, setUi, ui };
}
