/**
 * Map helpers for the campus map feature.
 */
import mapboxgl from "mapbox-gl";
import { KCL_CAMPUSES } from "../../lib/kclCampuses";
import { reverseGeocode } from "../../api/geocodeApi";

const BUILDING_LAYER_PAINT = {
  "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.5, ["get", "min_height"]],
  "fill-extrusion-color": ["interpolate", ["linear"], ["get", "height"], 0, "#e8e0d8", 30, "#d4c8bc", 80, "#c0b4a8"],
  "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.5, ["get", "height"]],
  "fill-extrusion-opacity": 0.75,
};

function createCampusMarkerEl(campus) {
  const element = document.createElement("div"), inner = document.createElement("div"), label = document.createElement("span");
  element.className = "campusMarker"; element.title = campus.name; inner.className = "campusMarkerInner"; inner.style.background = campus.color; label.className = "campusMarkerLabel"; label.textContent = campus.shortName; element.append(inner, label);
  return element;
}

function createCampusPopup(campus) {
  return new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 28 }).setHTML(`<div class="locPopup">🏛️ ${campus.name}</div>`);
}

function labelLayerId(map) {
  return map.getStyle().layers.find((layer) => layer.type === "symbol" && layer.layout["text-field"])?.id;
}

function add3dBuildingsLayer(map) {
  map.addLayer({ filter: ["==", "extrude", "true"], id: "3d-buildings", minzoom: 14, paint: BUILDING_LAYER_PAINT, source: "composite", "source-layer": "building", type: "fill-extrusion" }, labelLayerId(map));
}

function addRouteLayers(map) {
  map.addSource("route", { data: { features: [], type: "FeatureCollection" }, type: "geojson" });
  map.addLayer({ id: "route-line", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#FF0000", "line-dasharray": [2, 2], "line-opacity": 0.9, "line-width": 5 }, source: "route", type: "line" });
  map.addLayer({ id: "route-line-border", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-opacity": 0.3, "line-width": 9 }, source: "route", type: "line" }, "route-line");
}

function addCampusMarkers(map, markerRef, onCampusMarkerSelect) {
  markerRef.current = KCL_CAMPUSES.map((campus) => {
    const marker = new mapboxgl.Marker({ anchor: "bottom", element: createCampusMarkerEl(campus) }).setLngLat(campus.coords).setPopup(createCampusPopup(campus)).addTo(map);
    marker.getElement().addEventListener("click", (event) => { event.stopPropagation(); onCampusMarkerSelect(campus, markerRef.current, marker); });
    return marker;
  });
}

function popupIsOpen(marker) {
  return marker.getPopup().isOpen();
}

function isHomeStart(startLocation, userHome) {
  return startLocation && Math.abs(startLocation.lat - userHome.lat) < 0.0001 && Math.abs(startLocation.lng - userHome.lng) < 0.0001;
}

function createHomeMarkerEl() {
  const element = document.createElement("div");
  element.className = "homePointer";
  element.innerHTML = "🏠";
  element.title = "User Home";
  return element;
}

function createHomePopup(userHome) {
  return new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 25 }).setHTML(`<div class="homePopupContent"><div class="homePopupTitle">🏠User Home</div><button id="setHomeAsStart" class="homePopupButton">${userHome.address ? "Set Home as Start" : "Use Home as Start"}</button></div>`);
}

async function setHomeStart(userHome, setSelection, setForm) {
  const address = userHome.address || await reverseGeocode(userHome.lat, userHome.lng);
  setSelection((current) => ({ ...current, startLocation: { lat: userHome.lat, lng: userHome.lng } }));
  if (address) setForm((current) => ({ ...current, manualStart: address }));
}

function flyToHome(map, userHome) {
  map.current?.flyTo({ center: [userHome.lng, userHome.lat], duration: 1200, pitch: 55, zoom: 15 });
}

function wireHomeButton(userHome, refs, setSelection, setForm) {
  document.getElementById("setHomeAsStart")?.addEventListener("click", async () => { await setHomeStart(userHome, setSelection, setForm); if (popupIsOpen(refs.homePointer.current)) refs.homePointer.current.togglePopup(); flyToHome(refs.map, userHome); });
}

function clearHomeArtifacts(refs) {
  refs.homePointer.current?.remove();
  refs.homePopup.current?.remove();
  refs.homePointer.current = null;
  refs.homePopup.current = null;
}

function createStartMarkerEl() {
  const element = document.createElement("div"), pulse = document.createElement("div"), dot = document.createElement("div");
  element.className = "startMarker"; pulse.className = "startMarkerPulse"; dot.className = "startMarkerDot"; element.append(pulse, dot);
  return element;
}

export function initMapInstance(container) {
  return new mapboxgl.Map({ antialias: true, bearing: -12, center: [-0.105, 51.502], container, pitch: 55, style: "mapbox://styles/mapbox/streets-v12", zoom: 13 });
}

export function handleMapLoad(refs, onCampusMarkerSelect) {
  add3dBuildingsLayer(refs.map.current);
  addRouteLayers(refs.map.current);
  addCampusMarkers(refs.map.current, refs.campusMarkers, onCampusMarkerSelect);
  refs.routeLayerAdded.current = true;
}

export function createMapClickHandler(setSelection, setForm) {
  return async (event) => {
    if (event.originalEvent.defaultPrevented) return;
    const startLocation = { lat: event.lngLat.lat, lng: event.lngLat.lng }, address = await reverseGeocode(event.lngLat.lat, event.lngLat.lng);
    setSelection((current) => ({ ...current, startLocation })); if (address) setForm((current) => ({ ...current, manualStart: address }));
  };
}

export function cleanupMap(refs) {
  refs.campusMarkers.current.forEach((marker) => marker.remove());
  refs.campusMarkers.current = [];
  clearHomeArtifacts(refs);
  refs.startMarker.current?.remove();
  refs.startPopup.current?.remove();
  refs.map.current?.remove();
  refs.map.current = null;
}

export function syncHomeMarker(refs, mapLoaded, startLocation, userHome, setSelection, setForm) {
  if (!mapLoaded || !userHome) return;
  clearHomeArtifacts(refs);
  refs.homePopup.current = createHomePopup(userHome);
  refs.homePointer.current = new mapboxgl.Marker({ anchor: "bottom", element: createHomeMarkerEl() }).setLngLat([userHome.lng, userHome.lat]).setPopup(refs.homePopup.current).addTo(refs.map.current);
  if (!isHomeStart(startLocation, userHome)) refs.homePointer.current.togglePopup();
  window.setTimeout(() => wireHomeButton(userHome, refs, setSelection, setForm), 100);
}

export function syncStartMarker(refs, mapLoaded, startLocation) {
  if (!mapLoaded || !startLocation) return;
  refs.startMarker.current?.remove();
  refs.startPopup.current?.remove();
  refs.startPopup.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 20 }).setLngLat([startLocation.lng, startLocation.lat]).setHTML('<div class="locPopup">📍Me</div>').addTo(refs.map.current);
  refs.startMarker.current = new mapboxgl.Marker({ anchor: "center", element: createStartMarkerEl() }).setLngLat([startLocation.lng, startLocation.lat]).addTo(refs.map.current);
}

export function syncSelectedCampusPopup(campusMarkersRef, mapLoaded, selectedCampus) {
  if (!mapLoaded) return;
  campusMarkersRef.current.forEach((marker, index) => { const selected = KCL_CAMPUSES[index].id === selectedCampus?.id; if (selected && !popupIsOpen(marker)) marker.togglePopup(); if (!selected && popupIsOpen(marker)) marker.togglePopup(); });
}

export function displayRoute(map, route) {
  map.getSource("route").setData({ features: [{ geometry: route.geometry, type: "Feature" }], type: "FeatureCollection" });
  fitMapToRoute(map, route.geometry.coordinates);
}

export function clearRouteSource(map) {
  map?.getSource("route")?.setData({ features: [], type: "FeatureCollection" });
}

export async function fetchWalkingRoute(start, destination) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${destination.lng},${destination.lat}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
  const response = await fetch(url); if (!response.ok) throw new Error("API map failed...");
  const data = await response.json();
  return data.routes?.[0] || null;
}

export function getEffectiveDestination(customDestination, selectedCampus) {
  if (customDestination) return customDestination;
  if (selectedCampus) return { lat: selectedCampus.coords[1], lng: selectedCampus.coords[0] };
  return null;
}

export function parseRouteInfo(route) {
  return { distance: route.distance, duration: route.duration, steps: route.legs[0].steps.map((step) => ({ distance: step.distance, duration: step.duration, instruction: step.maneuver.instruction, type: step.maneuver.type })) };
}

export function fitMapToRoute(map, coords) {
  const bounds = coords.reduce((current, coord) => current.extend(coord), new mapboxgl.LngLatBounds(coords[0], coords[0]));
  map.fitBounds(bounds, { duration: 1500, padding: { bottom: 80, left: 80, right: 80, top: 80 }, pitch: 55 });
}
