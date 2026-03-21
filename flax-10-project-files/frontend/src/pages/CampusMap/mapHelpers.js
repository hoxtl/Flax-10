import mapboxgl from 'mapbox-gl';
import { reverseGeocode } from '../../api/userApi';

const BUILDING_LAYER_PAINT = {
  'fill-extrusion-color': [
    'interpolate', ['linear'], ['get', 'height'],
    0, '#e8e0d8', 30, '#d4c8bc', 80, '#c0b4a8',
  ],
  'fill-extrusion-height': [
    'interpolate', ['linear'], ['zoom'],
    14, 0, 14.5, ['get', 'height'],
  ],
  'fill-extrusion-base': [
    'interpolate', ['linear'], ['zoom'],
    14, 0, 14.5, ['get', 'min_height'],
  ],
  'fill-extrusion-opacity': 0.75,
};

export function initMapInstance(container) {
  return new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-0.105, 51.502],
    zoom: 13,
    pitch: 55,
    bearing: -12,
    antialias: true,
  });
}

export function add3dBuildingsLayer(map, labelLayerId) {
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: BUILDING_LAYER_PAINT,
  }, labelLayerId);
}

export function addRouteLayers(map) {
  map.addSource('route', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#FF0000', 'line-width': 5, 'line-opacity': 0.9, 'line-dasharray': [2, 2] },
  });
  map.addLayer({
    id: 'route-line-border',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0.3 },
  }, 'route-line');
}

export function createCampusMarkerEl(campus, stylesModule) {
  const el = document.createElement('div');
  el.className = stylesModule.campusMarker;
  el.title = campus.name;
  const inner = document.createElement('div');
  inner.className = stylesModule.campusMarkerInner;
  inner.style.background = campus.color;
  const label = document.createElement('span');
  label.className = stylesModule.campusMarkerLabel;
  label.textContent = campus.shortName;
  el.appendChild(inner);
  el.appendChild(label);
  return el;
}

export function addCampusMarkers(map, campuses, stylesModule, onSelect) {
  const markers = [];
  campuses.forEach((campus) => {
    const el = createCampusMarkerEl(campus, stylesModule);
    const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, closeOnClick: false })
      .setHTML(`<div class="locPopup">🏛️ ${campus.name}</div>`);
    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(campus.coords)
      .setPopup(popup)
      .addTo(map);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(campus, markers, marker);
    });
    markers.push(marker);
  });
  return markers;
}

export function handleMapLoad(map, campuses, campusMarkers, routeLayerAdded, stylesModule, onCampusSelect, onLoaded) {
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find((l) => l.type === 'symbol' && l.layout['text-field'])?.id;
  add3dBuildingsLayer(map, labelLayerId);
  addRouteLayers(map);
  campusMarkers.current = addCampusMarkers(map, campuses, stylesModule, onCampusSelect);
  routeLayerAdded.current = true;
  onLoaded();
}

export function cleanupMap(map, campusMarkers, eventMarkers, homePointer, homePopup) {
  campusMarkers.current.forEach((m) => m.remove());
  campusMarkers.current = [];
  eventMarkers.current.forEach((m) => m.remove());
  eventMarkers.current = [];
  homePointer.current?.remove();
  homePopup.current?.remove();
  map.current?.remove();
  map.current = null;
}

export function createHomeMarkerEl(stylesModule) {
  const el = document.createElement('div');
  el.className = stylesModule.homePointer;
  el.innerHTML = '🏠';
  el.title = 'User Home';
  return el;
}

export function homePopupHTML(userHome) {
  return `<div class="HomePopupContent">
    <div class="HomePopupTitle">🏠User Home</div>
    <button id="setHomeAsStart" class="HomePopupButton">Set Home as Start</button>
  </div>`;
}

async function handleHomeButtonClick(userHome, homePointerRef, mapRef, setStartLocation, setManualStart) {
  setStartLocation({ lng: userHome.lng, lat: userHome.lat });
  if (userHome.address) {
    setManualStart(userHome.address)
  } else {
    const address = await reverseGeocode(userHome.lat, userHome.lng);
    if (address) {
      setManualStart(address);
    }
  }
  if (homePointerRef.current?.getPopup().isOpen()) homePointerRef.current.togglePopup();
  mapRef.current?.flyTo({ center: [userHome.lng, userHome.lat], zoom: 15, pitch: 55, duration: 1200 });
}

export function wireHomeButton(userHome, homePointerRef, mapRef, setStartLocation, setManualStart) {
  const btn = document.getElementById('setHomeAsStart');
  if (!btn) return;
  btn.addEventListener('click', () => handleHomeButtonClick(userHome, homePointerRef, mapRef, setStartLocation, setManualStart));
}

export function createStartMarkerEl(stylesModule) {
  const el = document.createElement('div');
  el.className = stylesModule.startMarker;
  const pulse = document.createElement('div');
  pulse.className = stylesModule.startMarkerPulse;
  const dot = document.createElement('div');
  dot.className = stylesModule.startMarkerDot;
  el.appendChild(pulse);
  el.appendChild(dot);
  return el;
}

export function displayRoute(map, route) {
  map.getSource('route').setData({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: route.geometry }],
  });
  fitMapToRoute(map, route.geometry.coordinates);
}

export function clearRouteSource(map) {
  map.getSource('route')?.setData({ type: 'FeatureCollection', features: [] });
}

export async function fetchWalkingRoute(start, destination) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${destination.lng},${destination.lat}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API map failed...');
  const data = await res.json();
  if (!data.routes?.length) return null;
  return data.routes[0];
}

export function getEffectiveDestination(customDestination, selectedCampus) {
  if (customDestination) return customDestination;
  if (selectedCampus) return { lng: selectedCampus.coords[0], lat: selectedCampus.coords[1] };
  return null;
}

export function parseRouteInfo(route) {
  return {
    duration: route.duration,
    distance: route.distance,
    steps: route.legs[0].steps.map((s) => ({
      instruction: s.maneuver.instruction,
      distance: s.distance,
      duration: s.duration,
      type: s.maneuver.type,
    })),
  };
}

export function fitMapToRoute(map, coords) {
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new mapboxgl.LngLatBounds(coords[0], coords[0]),
  );
  map.fitBounds(bounds, { padding: { top: 80, bottom: 80, left: 80, right: 80 }, pitch: 55, duration: 1500 });
}
