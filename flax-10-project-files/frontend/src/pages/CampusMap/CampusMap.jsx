import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import styles from './CampusMap.module.css';
import { KCL_CAMPUSES } from '../../lib/kclCampuses';
import { CampusMapSkeleton } from '../../components/CampusMap/CampusMapSkeleton';
import { SidebarHeader } from '../../components/CampusMap/SidebarHeader';
import { TflStatusSection } from '../../components/CampusMap/TflStatusSection';
import { UserJourneySection } from '../../components/CampusMap/UserJourneySection';
import { CalendarEventsSection } from '../../components/CampusMap/CalendarEventsSection';
import { LocationSection } from '../../components/CampusMap/LocationSection';
import { DestinationSection } from '../../components/CampusMap/DestinationSection';
import { TransportModesSection } from '../../components/CampusMap/TransportModesSection';
import { CampusQuickNav } from '../../components/CampusMap/CampusQuickNav';
import { useDisruptions } from './hooks/useDisruptions';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import { useHomeAddress } from './hooks/useHomeAddress';
import { reverseGeocode } from '../../api/userApi';
import { tflService } from '../../api/tflApi';
import {
  initMapInstance, handleMapLoad, cleanupMap,
  createHomeMarkerEl, homePopupHTML, wireHomeButton,
  fetchWalkingRoute, getEffectiveDestination, parseRouteInfo,
  createStartMarkerEl, displayRoute, clearRouteSource,
} from './mapHelpers';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

async function applyWalkingRoute(start, destination, map, setRouteInfo, setRouteError) {
  const route = await fetchWalkingRoute(start, destination);
  if (!route) { setRouteError('No walking route found between these locations.'); clearRouteSource(map); return; }
  displayRoute(map, route);
  setRouteInfo(parseRouteInfo(route));
}

async function applyTflRoute(startLocation, destination, setTflRouteInfo, setTflRouteError) {
  const journey = await tflService.journeyPlanner(startLocation.lat, startLocation.lng, destination.lat, destination.lng);
  if (!journey) { setTflRouteError('No TfL journey found between the two selected locations...'); return; }
  setTflRouteInfo(journey);
}

const MIN_MAP_SKELETON_MS = 900;

const SHEET_VARIANTS = {
  closed: { y: 'calc(85vh - 70px)' },
  mid: { y: 'calc(85vh - 300px)' },
  open: { y: 0 },
};

export default function CampusMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const startMarker = useRef(null);
  const startPopup = useRef(null);
  const campusMarkers = useRef([]);
  const eventMarkers = useRef([]);
  const routeLayerAdded = useRef(false);
  const homePointer = useRef(null);
  const homePopup = useRef(null);

  const [startLocation, setStartLocation] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [customDestination, setCustomDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [tflRouteInfo, setTflRouteInfo] = useState(null);
  const [tflRouteError, setTflRouteError] = useState('');
  const [loadingTflRoute, setLoadingTflRoute] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [walkingInstructions, setWalkingInstructions] = useState(false);
  const [tflInstructions, setTflInstructions] = useState(false);
  const [manualStart, setManualStart] = useState('');
  const [manualDestination, setManualDestination] = useState('');
  const [minSkeletonElapsed, setMinSkeletonElapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const { disruptions, loading: loadingDisruptions } = useDisruptions();
  const { events: calendarEvents } = useCalendarEvents();
  const { userHome } = useHomeAddress();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinSkeletonElapsed(true), MIN_MAP_SKELETON_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = initMapInstance(mapContainer.current);
    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.current.on('load', () => handleMapLoad(map.current, KCL_CAMPUSES, campusMarkers, routeLayerAdded, styles, onCampusMarkerSelect, () => setMapLoaded(true)));
    map.current.on('click', async (e) => {
      if (!e.originalEvent.defaultPrevented) {
        const { lng, lat} = e.lngLat;
        setStartLocation({ lng, lat });
        const address = await reverseGeocode(lat, lng);
        if (address) {
          setManualStart(address);
        }
      }
    });
    return () => cleanupMap(map, campusMarkers, eventMarkers, homePointer, homePopup);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => map.current?.resize?.());
    return () => cancelAnimationFrame(id);
  }, [mapLoaded, isMobile]);

  useEffect(() => {
    if (!mapLoaded || !userHome) return;
    homePointer.current?.remove();
    homePointer.current = null;
    homePopup.current?.remove();
    homePopup.current = null;
    homePopup.current = new mapboxgl.Popup({ offset: 25, closeButton: false, closeOnClick: false, className: styles.homePopupContainer })
      .setHTML(homePopupHTML(userHome));
    homePointer.current = new mapboxgl.Marker({ element: createHomeMarkerEl(styles), anchor: 'bottom' })
      .setLngLat([userHome.lng, userHome.lat])
      .setPopup(homePopup.current)
      .addTo(map.current);
    const isHomeStart = startLocation && Math.abs(startLocation.lat - userHome.lat) < 0.0001 && Math.abs(startLocation.lng - userHome.lng) < 0.0001;
    if (!isHomeStart) homePointer.current.togglePopup();
    setTimeout(() => wireHomeButton(userHome, homePointer, map, setStartLocation), 100);
  }, [userHome, mapLoaded, startLocation]);

  useEffect(() => {
    if (!mapLoaded || !startLocation) return;
    startMarker.current?.remove();
    const el = createStartMarkerEl(styles);
    startPopup.current?.remove();
    startPopup.current = new mapboxgl.Popup({ offset: 20, closeButton: false, closeOnClick: false })
      .setLngLat([startLocation.lng, startLocation.lat])
      .setHTML('<div class="locPopup">📍Me</div>')
      .addTo(map.current);
    startMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([startLocation.lng, startLocation.lat])
      .addTo(map.current);
  }, [startLocation, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;
    campusMarkers.current.forEach((marker, i) => {
      const isSelected = KCL_CAMPUSES[i].id === selectedCampus?.id;
      const popup = marker.getPopup();
      if (isSelected && !popup.isOpen()) marker.togglePopup();
      else if (!isSelected && popup.isOpen()) marker.togglePopup();
    });
  }, [selectedCampus, mapLoaded]);

  const calculateRoute = useCallback(async () => {
    const destination = getEffectiveDestination(customDestination, selectedCampus);
    if (!startLocation || !destination || !routeLayerAdded.current) return;
    setLoadingRoute(true);
    setRouteError('');
    setRouteInfo(null);
    try {
      await applyWalkingRoute(startLocation, destination, map.current, setRouteInfo, setRouteError);
    } catch {
      setRouteError('Could not calculate the route, please try again...');
    } finally {
      setLoadingRoute(false);
    }
  }, [startLocation, selectedCampus, customDestination]);

  const calculateTflRoute = useCallback(async () => {
    const destination = getEffectiveDestination(customDestination, selectedCampus);
    if (!startLocation || !destination) return;
    setLoadingTflRoute(true);
    setTflRouteError('');
    setTflRouteInfo(null);
    try {
      await applyTflRoute(startLocation, destination, setTflRouteInfo, setTflRouteError);
    } catch (error) {
      console.error('Calculate TFL route error: ', error);
      setTflRouteError('Failed to calculate TfL route, please try again...');
    } finally {
      setLoadingTflRoute(false);
    }
  }, [startLocation, selectedCampus, customDestination]);

  const resetRoute = () => clearRouteSource(map.current);

  useEffect(() => {
    if (startLocation && (selectedCampus || customDestination)) {
      calculateRoute();
      calculateTflRoute();
    } else {
      resetRoute();
      setRouteInfo(null);
      setTflRouteInfo(null);
    }
  }, [startLocation, selectedCampus, customDestination, calculateRoute, calculateTflRoute]);

  const onCampusMarkerSelect = (campus, markers, clickedMarker) => {
    setSelectedCampus(campus);
    markers.forEach((m) => { if (m.getPopup().isOpen()) m.togglePopup(); });
    if (!clickedMarker.getPopup().isOpen()) clickedMarker.togglePopup();
  };

  const onGeoSuccess = async ({ coords }) => {
    const loc = { lng: coords.longitude, lat: coords.latitude };
    setStartLocation(loc);

    const address = await reverseGeocode(coords.latitude, coords.longitude);
    if (address) { setManualStart(address) };

    map.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 15, pitch: 55, duration: 1200 });
    setLocating(false);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(onGeoSuccess, () => setLocating(false), { enableHighAccuracy: true, timeout: 8000 });
  };

  const handleClearStart = () => {
    setStartLocation(null);
    setRouteInfo(null);
    setTflRouteInfo(null);
    startMarker.current?.remove();
    startMarker.current = null;
    startPopup.current?.remove();
    startPopup.current = null;
    resetRoute();
  };

  const handleClearCampus = () => {
    setSelectedCampus(null);
    setCustomDestination(null);
    setRouteInfo(null);
    setTflRouteInfo(null);
    resetRoute();
  };

  const flyToCampus = (campus) => {
    map.current?.flyTo({ center: campus.coords, zoom: 16, pitch: 60, bearing: Math.random() * 60 - 30, duration: 2000 });
  };

  const handleSelectCampus = (campus) => {
    setSelectedCampus(campus);
    flyToCampus(campus);
  };

  const handleUserJourneyCalculate = (startCoords, destCoords) => {
    setStartLocation({ lng: startCoords.longitude, lat: startCoords.latitude });
    setCustomDestination({ lng: destCoords.longitude, lat: destCoords.latitude, name: manualDestination, address: manualDestination });
    setSelectedCampus(null);
    const bounds = new mapboxgl.LngLatBounds()
      .extend([startCoords.longitude, startCoords.latitude])
      .extend([destCoords.longitude, destCoords.latitude]);
    map.current?.fitBounds(bounds, { padding: { top: 100, bottom: 100, left: 100, right: 100 }, duration: 1500 });
  };

  const handleEventClick = useCallback((event) => {
    const dest = { lng: event.longitude, lat: event.latitude, name: event.title, address: event.location };
    if (!startLocation && !selectedCampus) {
      setStartLocation({ lng: event.longitude, lat: event.latitude });
    } else if (selectedCampus && !startLocation) {
      setStartLocation({ lng: selectedCampus.coords[0], lat: selectedCampus.coords[1] });
      setCustomDestination(dest);
      setSelectedCampus(null);
    } else {
      setCustomDestination(dest);
      setSelectedCampus(null);
    }
    map.current?.flyTo({ center: [event.longitude, event.latitude], zoom: 15, pitch: 55, duration: 1200 });
  }, [startLocation, selectedCampus]);

  const showInitialSkeleton = !mapLoaded || !minSkeletonElapsed;

  return (
    <div className={styles.page}>
      {showInitialSkeleton && <CampusMapSkeleton />}

      <motion.aside
        className={styles.sidebar}
        style={showInitialSkeleton ? { visibility: 'hidden' } : undefined}
        initial={isMobile ? 'closed' : false}
        animate={isMobile ? undefined : { y: 0 }}
        drag={isMobile ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 500 }}
        dragElastic={0.1}
        onDragEnd={() => {}}
        variants={SHEET_VARIANTS}
      >
        <div className={styles.dragHandle} />
        <SidebarHeader />
        <TflStatusSection disruptions={disruptions} loading={loadingDisruptions} />
        <UserJourneySection
          manualStart={manualStart}
          setManualStart={setManualStart}
          manualDestination={manualDestination}
          setManualDestination={setManualDestination}
          onCalculate={handleUserJourneyCalculate}
        />
        <CalendarEventsSection events={calendarEvents} onEventClick={handleEventClick} />
        <LocationSection
          startLocation={startLocation}
          locating={locating}
          onGeolocate={handleGeolocate}
          onClear={handleClearStart}
        />
        <DestinationSection
          selectedCampus={selectedCampus}
          customDestination={customDestination}
          onClearCampus={handleClearCampus}
          onClearCustomDest={() => setCustomDestination(null)}
          onSelectCampus={handleSelectCampus}
        />
        <TransportModesSection
          startLocation={startLocation}
          selectedCampus={selectedCampus}
          customDestination={customDestination}
          routeInfo={routeInfo}
          routeError={routeError}
          loadingRoute={loadingRoute}
          tflRouteInfo={tflRouteInfo}
          tflRouteError={tflRouteError}
          loadingTflRoute={loadingTflRoute}
          walkingInstructions={walkingInstructions}
          tflInstructions={tflInstructions}
          onToggleWalking={() => setWalkingInstructions(!walkingInstructions)}
          onToggleTfl={() => setTflInstructions(!tflInstructions)}
        />
        <div className={styles.sidebarFooter}>
          <p>💡 Right-click + drag to rotate</p>
        </div>
      </motion.aside>

      <div className={styles.mapWrapper} style={showInitialSkeleton ? { visibility: 'hidden' } : undefined}>
        <div ref={mapContainer} className={styles.mapContainer} />
        <CampusQuickNav onFly={flyToCampus} />
      </div>
    </div>
  );
}
