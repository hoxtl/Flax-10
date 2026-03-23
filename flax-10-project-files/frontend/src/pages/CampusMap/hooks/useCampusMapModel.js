/**
 * Campus map page model.
 */

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { reverseGeocode } from "../../../api/geocodeApi";
import { tflService } from "../../../api/tflApi";
import { useCampusMapRefs } from "./useCampusMapRefs";
import { useCampusMapState } from "./useCampusMapState";
import { useDisruptions } from "./useDisruptions";
import { useHomeAddress } from "./useHomeAddress";
import { useResponsiveCampusMap } from "./useResponsiveCampusMap";
import { clearRouteSource, cleanupMap, createMapClickHandler, displayRoute, fetchWalkingRoute, getEffectiveDestination, handleMapLoad, parseRouteInfo, syncHomeMarker, syncSelectedCampusPopup, syncStartMarker } from "../mapHelpers";

function resetRouteState(setRoutes) {
  setRoutes((current) => ({ ...current, routeInfo: null, tflRouteInfo: null }));
}

function clearStartArtifacts(refs) {
  refs.startMarker.current?.remove();
  refs.startPopup.current?.remove();
  refs.startMarker.current = null;
  refs.startPopup.current = null;
}

function flyToCampus(map, campus) {
  map.current?.flyTo({ bearing: Math.random() * 60 - 30, center: campus.coords, duration: 2000, pitch: 60, zoom: 16 });
}

function clearStart(refs, setForm, setRoutes, setSelection) {
  setSelection((current) => ({ ...current, startLocation: null })); setForm((current) => ({ ...current, manualStart: "" })); resetRouteState(setRoutes); clearStartArtifacts(refs); clearRouteSource(refs.map.current);
}

function clearCampus(refs, setForm, setRoutes, setSelection) {
  setSelection((current) => ({ ...current, customDestination: null, selectedCampus: null })); setForm((current) => ({ ...current, manualDestination: "" })); resetRouteState(setRoutes); clearRouteSource(refs.map.current);
}

function selectCampus(map, campus, setForm, setSelection) {
  setSelection((current) => ({ ...current, customDestination: { address: campus.name, lat: campus.coords[1], lng: campus.coords[0], name: campus.name }, selectedCampus: campus })); setForm((current) => ({ ...current, manualDestination: campus.name })); flyToCampus(map, campus);
}

function clearAllSelections(refs, setForm, setRoutes, setSelection) {
  clearStart(refs, setForm, setRoutes, setSelection);
  clearCampus(refs, setForm, setRoutes, setSelection);
}

function handleCampusMarkerSelect(campus, markers, clickedMarker, setSelection) {
  setSelection((current) => ({ ...current, selectedCampus: campus }));
  markers.forEach((marker) => marker.getPopup().isOpen() && marker.togglePopup());
  if (!clickedMarker.getPopup().isOpen()) clickedMarker.togglePopup();
}

function setManualState(key, value, setForm) {
  setForm((current) => ({ ...current, [key]: value }));
}

function togglePanel(key, setUi) {
  setUi((current) => ({ ...current, [key]: !current[key] }));
}

function geolocateSuccess(map, setForm, setSelection, setUi) {
  return async ({ coords }) => {
    const address = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
    if (address) setForm((current) => ({ ...current, manualStart: address })); setSelection((current) => ({ ...current, startLocation: { lat: coords.latitude, lng: coords.longitude } })); map.current?.flyTo({ center: [coords.longitude, coords.latitude], duration: 1200, pitch: 55, zoom: 15 }); setUi((current) => ({ ...current, locating: false }));
  };
}

function handleGeolocate(map, setForm, setSelection, setUi) {
  if (!navigator.geolocation) return;
  setUi((current) => ({ ...current, locating: true }));
  navigator.geolocation.getCurrentPosition(geolocateSuccess(map, setForm, setSelection, setUi), () => setUi((current) => ({ ...current, locating: false })), { enableHighAccuracy: true, timeout: 8000 });
}

function handleJourneyCalculate(manualDestination, map, selectedCampus, setSelection) {
  return (startCoords, destCoords) => {
    setSelection((current) => ({ ...current, customDestination: selectedCampus ? current.customDestination : { address: manualDestination, lat: destCoords.latitude, lng: destCoords.longitude, name: manualDestination }, startLocation: { lat: startCoords.latitude, lng: startCoords.longitude } }));
    const bounds = new mapboxgl.LngLatBounds().extend([startCoords.longitude, startCoords.latitude]).extend([destCoords.longitude, destCoords.latitude]);
    map.current?.fitBounds(bounds, { duration: 1500, padding: { bottom: 100, left: 100, right: 100, top: 100 } });
  };
}

function useMapSetup(refs, setForm, setSelection, setUi) {
  useEffect(() => {
    const mapRef = refs.map, containerRef = refs.mapContainer;
    if (mapRef.current || !containerRef.current) return undefined;
    mapRef.current = new mapboxgl.Map({ antialias: true, bearing: -12, center: [-0.105, 51.502], container: containerRef.current, pitch: 55, style: "mapbox://styles/mapbox/streets-v12", zoom: 13 });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right"); mapRef.current.on("load", () => { handleMapLoad(refs, (...args) => handleCampusMarkerSelect(...args, setSelection)); setUi((current) => ({ ...current, mapLoaded: true })); }); mapRef.current.on("click", createMapClickHandler(setSelection, setForm));
    return () => cleanupMap(refs);
  }, [refs, setForm, setSelection, setUi]);
}

function useMapResize(mapLoaded, isMobile, mapRef) {
  useEffect(() => { const frame = requestAnimationFrame(() => mapRef.current?.resize?.()); return () => cancelAnimationFrame(frame); }, [isMobile, mapLoaded, mapRef]);
}

function useMarkerSync(refs, selection, setForm, setSelection, ui, userHome) {
  useEffect(() => syncHomeMarker(refs, ui.mapLoaded, selection.startLocation, userHome, setSelection, setForm), [refs, selection.startLocation, setForm, setSelection, ui.mapLoaded, userHome]);
  useEffect(() => syncStartMarker(refs, ui.mapLoaded, selection.startLocation), [refs, selection.startLocation, ui.mapLoaded]);
  useEffect(() => syncSelectedCampusPopup(refs.campusMarkers, ui.mapLoaded, selection.selectedCampus), [refs.campusMarkers, selection.selectedCampus, ui.mapLoaded]);
}

function useRoutes(refs, selection, setRoutes) {
  useEffect(() => {
    const destination = getEffectiveDestination(selection.customDestination, selection.selectedCampus); if (!selection.startLocation || !destination || !refs.routeLayerAdded.current) { clearRouteSource(refs.map.current); resetRouteState(setRoutes); return; }
    let active = true; setRoutes((current) => ({ ...current, loadingRoute: true, loadingTflRoute: true, routeError: "", routeInfo: null, tflRouteError: "", tflRouteInfo: null }));
    fetchWalkingRoute(selection.startLocation, destination).then((route) => { if (!active) return; if (!route) { clearRouteSource(refs.map.current); setRoutes((current) => ({ ...current, loadingRoute: false, routeError: "No walking route found between these locations." })); return; } displayRoute(refs.map.current, route); setRoutes((current) => ({ ...current, loadingRoute: false, routeInfo: parseRouteInfo(route) })); }).catch(() => active && setRoutes((current) => ({ ...current, loadingRoute: false, routeError: "Could not calculate the route, please try again..." })));
    tflService.journeyPlanner(selection.startLocation.lat, selection.startLocation.lng, destination.lat, destination.lng).then((journey) => active && setRoutes((current) => ({ ...current, loadingTflRoute: false, tflRouteError: journey ? "" : "No TfL journey found between the two selected locations...", tflRouteInfo: journey }))).catch(() => { if (active) setRoutes((current) => ({ ...current, loadingTflRoute: false, tflRouteError: "Failed to calculate TfL route, please try again..." })); });
    return () => { active = false; };
  }, [refs.map, refs.routeLayerAdded, selection, setRoutes]);
}

export function useCampusMapModel() {
  const refs = useCampusMapRefs(), state = useCampusMapState(), { disruptions, loading: loadingDisruptions } = useDisruptions(), { userHome } = useHomeAddress();
  useResponsiveCampusMap(state.setUi, state.ui.isMobile); useMapSetup(refs, state.setForm, state.setSelection, state.setUi); useMapResize(state.ui.mapLoaded, state.ui.isMobile, refs.map); useMarkerSync(refs, state.selection, state.setForm, state.setSelection, state.ui, userHome); useRoutes(refs, state.selection, state.setRoutes);
  return { clearAllSelections: () => clearAllSelections(refs, state.setForm, state.setRoutes, state.setSelection), clearCustomDestination: () => state.setSelection((current) => ({ ...current, customDestination: null })), disruptions, flyToCampus: (campus) => flyToCampus(refs.map, campus), form: state.form, handleClearCampus: () => clearCampus(refs, state.setForm, state.setRoutes, state.setSelection), handleClearStart: () => clearStart(refs, state.setForm, state.setRoutes, state.setSelection), handleGeolocate: () => handleGeolocate(refs.map, state.setForm, state.setSelection, state.setUi), handleSelectCampus: (campus) => selectCampus(refs.map, campus, state.setForm, state.setSelection), handleUserJourneyCalculate: handleJourneyCalculate(state.form.manualDestination, refs.map, state.selection.selectedCampus, state.setSelection), loadingDisruptions, mapContainer: refs.mapContainer, routes: state.routes, selection: state.selection, setManualDestination: (value) => setManualState("manualDestination", value, state.setForm), setManualStart: (value) => setManualState("manualStart", value, state.setForm), showInitialSkeleton: !state.ui.mapLoaded || !state.ui.minSkeletonElapsed, toggleTflInstructions: () => togglePanel("tflInstructions", state.setUi), toggleWalkingInstructions: () => togglePanel("walkingInstructions", state.setUi), ui: state.ui };
}
