/**
 * Campus map page model.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { reverseGeocode } from "../../../api/geocodeApi";
import { geocodeAddress } from "../../../api/geocodeApi";
import { getEvents } from "../../../api/eventApi";
import { tflService } from "../../../api/tflApi";
import { useCampusMapRefs } from "./useCampusMapRefs";
import { useCampusMapState } from "./useCampusMapState";
import { useDisruptions } from "./useDisruptions";
import { useHomeAddress } from "./useHomeAddress";
import { useResponsiveCampusMap } from "./useResponsiveCampusMap";
import { clearRouteSource, cleanupMap, createMapClickHandler, displayRoute, fetchWalkingRoute, getEffectiveDestination, handleMapLoad, parseRouteInfo, syncHomeMarker, syncSelectedCampusPopup, syncStartMarker } from "../mapHelpers";

const GEOLOCATION_TARGET_START = "start";
const GEOLOCATION_TARGET_DESTINATION = "destination";
const UPCOMING_WINDOW_HOURS = 2;
const UPCOMING_REFRESH_MS = 60000;

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

function formatCoordinateLocation(latitude, longitude) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function applyGeolocatedStart(address, coords, setForm, setSelection) {
  setForm((current) => ({
    ...current,
    manualStart: address || formatCoordinateLocation(coords.latitude, coords.longitude),
  }));
  setSelection((current) => ({
    ...current,
    startLocation: { lat: coords.latitude, lng: coords.longitude },
  }));
}

function applyGeolocatedDestination(address, coords, setForm, setSelection) {
  const fallbackAddress = formatCoordinateLocation(coords.latitude, coords.longitude);
  setForm((current) => ({
    ...current,
    manualDestination: address || fallbackAddress,
  }));
  setSelection((current) => ({
    ...current,
    customDestination: {
      address: address || fallbackAddress,
      lat: coords.latitude,
      lng: coords.longitude,
      name: "Current location",
    },
    selectedCampus: null,
  }));
}

function geolocateSuccess(map, setForm, setSelection, setUi, target) {
  return async ({ coords }) => {
    const address = await reverseGeocode(coords.latitude, coords.longitude).catch(() => null);
    if (target === GEOLOCATION_TARGET_DESTINATION) applyGeolocatedDestination(address, coords, setForm, setSelection);
    else applyGeolocatedStart(address, coords, setForm, setSelection);
    map.current?.flyTo({ center: [coords.longitude, coords.latitude], duration: 1200, pitch: 55, zoom: 15 });
    setUi((current) => ({ ...current, locating: false }));
  };
}

function handleGeolocate(map, setForm, setSelection, setUi, target = GEOLOCATION_TARGET_START) {
  if (!navigator.geolocation) return;
  setUi((current) => ({ ...current, locating: true }));
  navigator.geolocation.getCurrentPosition(
    geolocateSuccess(map, setForm, setSelection, setUi, target),
    () => setUi((current) => ({ ...current, locating: false })),
    { enableHighAccuracy: true, timeout: 8000 },
  );
}

function handleJourneyCalculate(manualDestination, map, selectedCampus, setSelection) {
  return (startCoords, destCoords) => {
    setSelection((current) => ({ ...current, customDestination: selectedCampus ? current.customDestination : { address: manualDestination, lat: destCoords.latitude, lng: destCoords.longitude, name: manualDestination }, startLocation: { lat: startCoords.latitude, lng: startCoords.longitude } }));
    const bounds = new mapboxgl.LngLatBounds().extend([startCoords.longitude, startCoords.latitude]).extend([destCoords.longitude, destCoords.latitude]);
    map.current?.fitBounds(bounds, { duration: 1500, padding: { bottom: 100, left: 100, right: 100, top: 100 } });
  };
}

function isUpcomingEvent(event, now, horizon) {
  const start = new Date(event?.start_time);
  if (Number.isNaN(start.getTime())) return false;
  if (start > horizon) return false;
  if (start >= now) return true;
  const end = event?.end_time ? new Date(event.end_time) : null;
  if (end && !Number.isNaN(end.getTime())) return end >= now;
  return false;
}

function sortByStartTime(a, b) {
  return new Date(a.start_time) - new Date(b.start_time);
}

function selectUpcomingEvents(events, now) {
  const horizon = new Date(now.getTime() + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000);
  return (events || [])
    .filter((event) => event?.location && isUpcomingEvent(event, now, horizon))
    .sort(sortByStartTime)
    .slice(0, 5);
}

function getUpcomingRange(now) {
  const horizon = new Date(now.getTime() + UPCOMING_WINDOW_HOURS * 60 * 60 * 1000);
  return { start: now.toISOString(), end: horizon.toISOString() };
}

function loadUpcomingEvents(setUpcomingEvents, activeRef) {
  const now = new Date();
  return getEvents(getUpcomingRange(now))
    .then((events = []) => {
      if (!activeRef.current) return;
      setUpcomingEvents(selectUpcomingEvents(events, now));
    });
}

function useUpcomingEvents(setUpcomingEvents) {
  useEffect(() => {
    const activeRef = { current: true };
    const run = () => loadUpcomingEvents(setUpcomingEvents, activeRef)
      .catch(() => activeRef.current && setUpcomingEvents([]));
    run();
    const interval = window.setInterval(run, UPCOMING_REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      activeRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setUpcomingEvents]);
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
  const context = useCampusMapContext();
  useCampusMapLifecycles(context);
  useDestinationQuerySync(context);
  const handleSelectUpcomingEvent = useUpcomingEventHandler(context);
  return buildCampusMapApi(context, handleSelectUpcomingEvent);
}

function useCampusMapContext() {
  const refs = useCampusMapRefs();
  const state = useCampusMapState();
  const { disruptions, loading: loadingDisruptions } = useDisruptions();
  const { userHome } = useHomeAddress();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const { search } = useLocation();
  const lastDestinationRef = useRef(null);
  return { disruptions, lastDestinationRef, loadingDisruptions, refs, search, setUpcomingEvents, state, upcomingEvents, userHome };
}

function useCampusMapLifecycles(context) {
  const { refs, setUpcomingEvents, state, userHome } = context;
  useResponsiveCampusMap(state.setUi, state.ui.isMobile);
  useMapSetup(refs, state.setForm, state.setSelection, state.setUi);
  useMapResize(state.ui.mapLoaded, state.ui.isMobile, refs.map);
  useMarkerSync(refs, state.selection, state.setForm, state.setSelection, state.ui, userHome);
  useRoutes(refs, state.selection, state.setRoutes);
  useUpcomingEvents(setUpcomingEvents);
}

function useDestinationQuerySync(context) {
  const { lastDestinationRef, refs, search, state } = context;
  const destinationQuery = getDestinationQuery(search);
  useEffect(() => {
    const trimmed = destinationQuery.trim();
    if (!trimmed || trimmed === lastDestinationRef.current) return;
    lastDestinationRef.current = trimmed;
    state.setForm((current) => ({ ...current, manualDestination: trimmed }));
    applyGeocodeLookup(trimmed, trimmed, state.setSelection, refs.map);
  }, [destinationQuery, lastDestinationRef, refs.map, state.setForm, state.setSelection]);
}

function useUpcomingEventHandler(context) {
  const { refs, state } = context;
  return useCallback((event) => {
    const trimmed = getEventLocation(event);
    if (!trimmed) return;
    state.setForm((current) => ({ ...current, manualDestination: trimmed }));
    applyGeocodeLookup(trimmed, event?.title || trimmed, state.setSelection, refs.map);
  }, [refs.map, state.setForm, state.setSelection]);
}

function buildCampusMapApi(context, handleSelectUpcomingEvent) {
  return {
    ...createSelectionActions(context, handleSelectUpcomingEvent),
    ...createGeolocationActions(context),
    ...createManualInputActions(context),
    ...createUiSnapshot(context),
  };
}

function createSelectionActions(context, handleSelectUpcomingEvent) {
  const { refs, state } = context;
  return {
    clearAllSelections: () => clearAllSelections(refs, state.setForm, state.setRoutes, state.setSelection),
    clearCustomDestination: () => state.setSelection((current) => ({ ...current, customDestination: null })),
    flyToCampus: (campus) => flyToCampus(refs.map, campus),
    handleClearCampus: () => clearCampus(refs, state.setForm, state.setRoutes, state.setSelection),
    handleClearStart: () => clearStart(refs, state.setForm, state.setRoutes, state.setSelection),
    handleSelectCampus: (campus) => selectCampus(refs.map, campus, state.setForm, state.setSelection),
    handleSelectUpcomingEvent,
    handleUserJourneyCalculate: handleJourneyCalculate(state.form.manualDestination, refs.map, state.selection.selectedCampus, state.setSelection),
  };
}

function createGeolocationActions(context) {
  const { refs, state } = context;
  return {
    handleGeolocate: () => handleGeolocate(refs.map, state.setForm, state.setSelection, state.setUi),
    handleGeolocateDestination: () => handleGeolocate(refs.map, state.setForm, state.setSelection, state.setUi, GEOLOCATION_TARGET_DESTINATION),
    handleGeolocateStart: () => handleGeolocate(refs.map, state.setForm, state.setSelection, state.setUi, GEOLOCATION_TARGET_START),
  };
}

function createManualInputActions(context) {
  const { state } = context;
  return {
    setManualDestination: (value) => setManualState("manualDestination", value, state.setForm),
    setManualStart: (value) => setManualState("manualStart", value, state.setForm),
  };
}

function createUiSnapshot(context) {
  const { disruptions, loadingDisruptions, refs, state, upcomingEvents } = context;
  return {
    disruptions,
    form: state.form,
    loadingDisruptions,
    mapContainer: refs.mapContainer,
    routes: state.routes,
    selection: state.selection,
    showInitialSkeleton: !state.ui.mapLoaded || !state.ui.minSkeletonElapsed,
    toggleTflInstructions: () => togglePanel("tflInstructions", state.setUi),
    toggleWalkingInstructions: () => togglePanel("walkingInstructions", state.setUi),
    ui: state.ui,
    upcomingEvents,
  };
}

function getDestinationQuery(search) {
  return new URLSearchParams(search).get("destination") || "";
}

function getEventLocation(event) {
  if (!event?.location) return "";
  return String(event.location).trim();
}

function applyGeocodeLookup(query, title, setSelection, mapRef) {
  geocodeAddress(query)
    .then((coords) => handleGeocodeCoords(coords, query, title, setSelection, mapRef))
    .catch(() => {});
}

function handleGeocodeCoords(coords, query, title, setSelection, mapRef) {
  if (!coords) return;
  setSelection((current) => ({
    ...current,
    customDestination: buildCustomDestination(query, coords, title),
    selectedCampus: null,
  }));
  focusMapOnCoords(mapRef, coords);
}

function buildCustomDestination(address, coords, title) {
  return {
    address,
    lat: coords.latitude,
    lng: coords.longitude,
    name: title,
  };
}

function focusMapOnCoords(mapRef, coords) {
  mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], duration: 1200, pitch: 55, zoom: 15 });
}
