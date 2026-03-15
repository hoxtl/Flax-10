import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./CampusMap.module.css";
import { tflService } from "../../api/tflService";
import { motion } from "framer-motion";
import { getHomeAddress } from "../../api/userService";
import { getCalendarEvents } from "../../api/calendarService";
import { KCL_CAMPUSES } from "../../lib/kclCampuses";
import { userJourneySection } from "../../components/CampusMap/UserJourneySection"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function travelTime(seconds) {
  const mins = Math.round(seconds / 60);

  if (mins < 60) {
    return `${mins} min${mins !== 1 ? "s" : ""}`;
  }

  const hrs = Math.floor(mins / 60);
  const minsLeft = mins % 60;

  return `${hrs}h ${minsLeft}m`;
}

function travelDistance(metres) {
  if (metres < 1000) {
    return `${Math.round(metres)} m`;
  }

  return `${(metres / 1000).toFixed(1)} km`;
}

export default function CampusMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const startMarker = useRef(null);

  const startPopup = useRef(null);

  const campusMarkers = useRef([]);
  const routeLayerAdded = useRef(false);

  const [startLocation, setStartLocation] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [instructionMode, setInstructionMode] = useState(false);
  const [tflInstructionMode, setTflInstructionMode] = useState(false);
  const [tflRouteInfo, setTflRouteInfo] = useState(null);
  const [loadingTflRoute, setLoadingTflRoute] = useState(false);
  const [tflRouteError, setTflRouteError] = useState("");
  const [disruptions, setDisruptions] = useState([]);
  const [loadingDisruptions, setLoadingDisruptions] = useState(false);
  const [showAllDisruptions, setShowAllDisruptions] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const eventMarkers = useRef([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [customDestination, setCustomDestination] = useState(null);
  const [manualStart, setManualStart] = useState("");
  const [manualDestination, setManualDestination] = useState("");

  // Mobile detection hook (matches DashboardLayout breakpoint)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Variants for the bottom sheet states
  const sheetVariants = {
    closed: { y: "calc(85vh - 70px)" }, // Just the header visible
    mid: { y: "calc(85vh - 300px)" }, // Half way
    open: { y: 0 }, // Fully open
  };

  const [userHome, setUserHome] = useState(null);
  const homePointer = useRef(null);
  const homePopup = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-0.105, 51.502],
      zoom: 13,
      pitch: 55,
      bearing: -12,
      antialias: true,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right",
    );

    map.current.on("load", () => {
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers.find(
        (l) => l.type === "symbol" && l.layout["text-field"],
      )?.id;

      map.current.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "height"],
              0,
              "#e8e0d8",
              30,
              "#d4c8bc",
              80,
              "#c0b4a8",
            ],
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14,
              0,
              14.5,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14,
              0,
              14.5,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.75,
          },
        },
        labelLayerId,
      );

      map.current.addSource("route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FF0000",
          "line-width": 5,
          "line-opacity": 0.9,
          "line-dasharray": [2, 2],
        },
      });

      map.current.addLayer(
        {
          id: "route-line-border",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 9,
            "line-opacity": 0.3,
          },
        },
        "route-line",
      );

      routeLayerAdded.current = true;
      setMapLoaded(true);

      // Add KCL campus markers
      KCL_CAMPUSES.forEach((campus) => {
        const el = document.createElement("div");
        el.className = styles.campusMarker;
        el.title = campus.name;

        const inner = document.createElement("div");
        inner.className = styles.campusMarkerInner;
        inner.style.background = campus.color;

        const label = document.createElement("span");
        label.className = styles.campusMarkerLabel;
        label.textContent = campus.shortName;

        el.appendChild(inner);
        el.appendChild(label);

        const popup = new mapboxgl.Popup({
          offset: 28,
          closeButton: false,
          closeOnClick: false,
        }).setHTML(`<div class="locPopup">🏛️ ${campus.name}</div>`);

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(campus.coords)
          .setPopup(popup)
          .addTo(map.current);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedCampus(campus);
          campusMarkers.current.forEach((m) => {
            if (m.getPopup().isOpen()) m.togglePopup();
          });
          if (!marker.getPopup().isOpen()) marker.togglePopup();
        });

        campusMarkers.current.push(marker);
      });
    });

    // Click to allow user to set a starting location
    map.current.on("click", (e) => {
      if (e.originalEvent.defaultPrevented) return;
      const { lng, lat } = e.lngLat;
      setStartLocation({ lng, lat });
    });

    return () => {
      campusMarkers.current.forEach((marker) => marker.remove());
      campusMarkers.current = [];
      eventMarkers.current.forEach(marker => marker.remove());
      eventMarkers.current = [];
      if (homePointer.current) homePointer.current.remove();
      if (homePopup.current) homePopup.current.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Load user's home address on the map
  useEffect(() => {
    const loadHomeAddress = async () => {
      try {
        const data = await getHomeAddress();
        if (data.home_latitude && data.home_longitude) {
          setUserHome({
            address: data.home_address,
            lat: data.home_latitude,
            lng: data.home_longitude,
          });
        }
      } catch (error) {
        console.error("User home could not be loaded: ", error);
      }
    };

    loadHomeAddress();

    const handleHomeUpdate = () => loadHomeAddress();
    window.addEventListener("home-address-updated", handleHomeUpdate);

    return () =>
      window.removeEventListener("home-address-updated", handleHomeUpdate);
  }, []);

  // Display user's home pointer on the map
  useEffect(() => {
    if (!mapLoaded || !userHome) return;

    if (homePointer.current) {
      homePointer.current.remove();
      homePointer.current = null;
    }
    if (homePopup.current) {
      homePopup.current.remove();
      homePopup.current = null;
    }

    const el = document.createElement("div");
    el.className = styles.homePointer;
    el.innerHTML = "🏠";
    el.title = "User Home";

    homePopup.current = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      className: styles.homePopupContainer,
    }).setHTML(`
      <div class="HomePopupContent">
        <div class="HomePopupTitle">🏠User Home</div>
        <button id="setHomeAsStart" class="HomePopupButton">
          Set Home as Start
        </button>
      </div>`);

    homePointer.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([userHome.lng, userHome.lat])
      .setPopup(homePopup.current)
      .addTo(map.current);

    const isHomeStartingLoc =
      startLocation &&
      Math.abs(startLocation.lat - userHome.lat) < 0.0001 &&
      Math.abs(startLocation.lng - userHome.lng) < 0.0001;

    if (!isHomeStartingLoc) {
      homePointer.current.togglePopup();
    }

    setTimeout(() => {
      const btn = document.getElementById("setHomeAsStart");
      if (btn) {
        btn.addEventListener("click", () => {
          setStartLocation({ lng: userHome.lng, lat: userHome.lat });
          if (homePointer.current && homePointer.current.getPopup().isOpen()) {
            homePointer.current.togglePopup();
          }
          map.current?.flyTo({
            center: [userHome.lng, userHome.lat],
            zoom: 15,
            pitch: 55,
            duration: 1200,
          });
        });
      }
    }, 100);
  }, [userHome, mapLoaded, startLocation]);

  // Add calendar events to the map
  useEffect(() => {
    const loadCalendarEvents = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const data = await getCalendarEvents();
        setCalendarEvents(data.events || []);
      } catch (error) {
        console.log('Unable to load calendar events...');
      }
    };
    loadCalendarEvents();
    const handleRefresh = () => loadCalendarEvents();
    window.addEventListener('calendar-event-updated', handleRefresh);
    return () => {
      window.removeEventListener('calendar-event-updated', handleRefresh);
    };
  }, []);

  // Update the marker on the map when user's start location changes
  useEffect(() => {
    if (!mapLoaded || !startLocation) return;

    if (startMarker.current) startMarker.current.remove();

    const el = document.createElement("div");
    el.className = styles.startMarker;

    const pulse = document.createElement("div");
    pulse.className = styles.startMarkerPulse;

    const dot = document.createElement("div");
    dot.className = styles.startMarkerDot;

    el.appendChild(pulse);
    el.appendChild(dot);

    if (startPopup.current) startPopup.current.remove();

    startPopup.current = new mapboxgl.Popup({
      offset: 20,
      closeButton: false,
      closeOnClick: false,
    })
      .setLngLat([startLocation.lng, startLocation.lat])
      .setHTML('<div class="locPopup">📍Me</div>')
      .addTo(map.current);

    startMarker.current = new mapboxgl.Marker({ element: el, anchor: "center" })
      .setLngLat([startLocation.lng, startLocation.lat])
      .addTo(map.current);
  }, [startLocation, mapLoaded]);

  // Fetch TfL service disruptions
  useEffect(() => {
    const fetchDisruptions = async () => {
      setLoadingDisruptions(true);
      try {
        const disruptions = await tflService.getTfLDelays();
        setDisruptions(disruptions);
      } catch (error) {
        console.error("TfL disruption fetch error: ", error);
      } finally {
        setLoadingDisruptions(false);
      }
    };

    fetchDisruptions();

    const refreshInterval = setInterval(fetchDisruptions, 2 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;

    campusMarkers.current.forEach((marker, i) => {
      const isCampusSelected = KCL_CAMPUSES[i].id === selectedCampus?.id;
      const campusPopup = marker.getPopup();
      if (isCampusSelected && !campusPopup.isOpen()) {
        marker.togglePopup();
      } else if (!isCampusSelected && campusPopup.isOpen()) {
        marker.togglePopup();
      }
    });
  }, [selectedCampus, mapLoaded]);

  // Calculate walking time/distance from start location to selected campus
  const calculateRoute = useCallback(async () => {
    const destination = customDestination || (selectedCampus ? {
      lng: selectedCampus.coords[0],
      lat: selectedCampus.coords[1]
    } : null);
    if (!startLocation || !destination || !routeLayerAdded.current) return;

    setLoadingRoute(true);
    setRouteError("");
    setRouteInfo(null);

    const { lng, lat } = startLocation;
    const dstLng = destination.lng;
    const dstLat = destination.lat;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${lng},${lat};${dstLng},${dstLat}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("API map failed...");
      }

      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        setRouteError("No walking route found between these locations.");
        map.current
          .getSource("route")
          .setData({ type: "FeatureCollection", features: [] });
        return;
      }

      const route = data.routes[0];
      const geojson = {
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: route.geometry }],
      };

      map.current.getSource("route").setData(geojson);

      setRouteInfo({
        duration: route.duration,
        distance: route.distance,
        steps: route.legs[0].steps.map((s) => ({
          instruction: s.maneuver.instruction,
          distance: s.distance,
          duration: s.duration,
          type: s.maneuver.type,
        })),
      });

      const coords = route.geometry.coordinates;
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(coords[0], coords[0]),
      );
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        pitch: 55,
        duration: 1500,
      });
    } catch (err) {
      setRouteError("Could not calculate the route, please try again...");
    } finally {
      setLoadingRoute(false);
    }
  }, [startLocation, selectedCampus, customDestination]);

  const calculateTflRoute = useCallback(async () => {
    const destination = customDestination || (selectedCampus ? {
      lng: selectedCampus.coords[0],
      lat: selectedCampus.coords[1]
    } : null);
    if (!startLocation || !destination) return;

    setLoadingTflRoute(true);
    setTflRouteError("");
    setTflRouteInfo(null);

    const { lng, lat } = startLocation;
    const dstLng = destination.lng;
    const dstLat = destination.lat;

    try {
      const tflJourney = await tflService.journeyPlanner(
        lat,
        lng,
        dstLat,
        dstLng,
      );
      if (!tflJourney) {
        setTflRouteError(
          "No TfL journey found between the two selected locations...",
        );
        return;
      }
      setTflRouteInfo(tflJourney);
    } catch (error) {
      console.error("Calculate TFL route error: ", error);
      setTflRouteError("Failed to calculate TfL route, please try again...");
    } finally {
      setLoadingTflRoute(false);
    }
  }, [startLocation, selectedCampus, customDestination]);

  const resetRoute = (routeID) => {
    const source = map.current?.getSource(routeID);

    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: [],
    });
  };

  useEffect(() => {
    if (startLocation && (selectedCampus || customDestination)) {
      calculateRoute();
      calculateTflRoute();
    } else if (routeLayerAdded.current) {
      resetRoute("route");
      setRouteInfo(null);
      setTflRouteInfo(null);
    }
  }, [startLocation, selectedCampus, customDestination, calculateRoute, calculateTflRoute]);

  // Use GPS of user's device
  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lng: coords.longitude, lat: coords.latitude };
        setStartLocation(loc);
        map.current?.flyTo({
          center: [loc.lng, loc.lat],
          zoom: 15,
          pitch: 55,
          duration: 1200,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleClearStart = () => {
    setStartLocation(null);
    setRouteInfo(null);
    setTflRouteInfo(null);
    if (startMarker.current) {
      startMarker.current.remove();
      startMarker.current = null;
    }
    if (startPopup.current) {
      startPopup.current.remove();
      startPopup.current = null;
    }
    resetRoute("route");
  };

  const handleClearCampus = () => {
    setSelectedCampus(null);
    setCustomDestination(null);
    setRouteInfo(null);
    setTflRouteInfo(null);
    resetRoute("route");
  };

  const flyToCampus = (campus) => {
    map.current?.flyTo({
      center: campus.coords,
      zoom: 16,
      pitch: 60,
      bearing: Math.random() * 60 - 30,
      duration: 2000,
    });
  };

  return (
    <div className={styles.page}>
      <motion.aside
        className={styles.sidebar}
        initial={isMobile ? "closed" : false}
        animate={isMobile ? undefined : { y: 0 }}
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 500 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100) {
            /* this is where I'd put my snap logic */
          }
        }}
      >
        <div className={styles.dragHandle} />

        <section className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <span className={styles.sidebarIcon}>🌎</span>
            StudyFlax Map
          </div>
          <p className={styles.sidebarSubtitle}>
            Never be late, plan your journeys!
          </p>
        </section>

        {/* TfL Service Status */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.statusIcon}>⚠️</span>
            TfL Line Status
          </div>

          {loadingDisruptions ? (
            <div className={styles.loadingDisruptions}>
              <span className={styles.spinner} />
              <span>Checking TfL Line status...</span>
            </div>
          ) : disruptions.length === 0 ? (
            <div className={styles.goodService}>
              <span className={styles.goodServiceIcon}>✅</span>
              <div className={styles.goodServiceText}>
                <strong>Good Service!</strong>
                <span>All TfL lines are running normally</span>
              </div>
            </div>
          ) : (
          <>
            <div className={styles.disruptionsList}>
              {(showAllDisruptions ? disruptions : disruptions.slice(0, 2)).map((disruption, i) => (
                <div key={i} className={styles.disruptionCard}>
                  <div
                    className={styles.disruptionBadge}
                    style={{ backgroundColor: disruption.color }}
                  >
                    - {disruption.lineName}
                  </div>
                  <div className={styles.disruptionContent}>
                    <div className={styles.disruptionSeverity}>
                      {disruption.severityDescription}
                    </div>
                    <div className={styles.disruptionReason}>
                      {disruption.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {disruptions.length > 2 && (
              <button
                className={styles.showMoreBtn}
                onClick={() => setShowAllDisruptions(!showAllDisruptions)}
              >
                {showAllDisruptions ? (
                  <>
                    Show Less <span>▲</span>
                  </>
                ) : (
                  <>
                    Show {disruptions.length - 2} More <span>▼</span>
                  </>
                )}
              </button>
            )}
          </>
        )}

          <div className={styles.lastUpdated}>
            Last Updated:{" "}
            {new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </section>

        {/* Calendar Events */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.calendarIcon}>📅</span>
            Events Today
          </div>

          {calendarEvents.length === 0 ? (
            <div className={styles.noEvents}>
              <span className={styles.noEventsIcon}>✨</span>
              <p>No events to show on UniMap...</p>
            </div>
          ) : (
            <div>
              <div className={styles.eventsList}>
                {(showAllEvents ? calendarEvents : calendarEvents.slice(0, 3)).map((event) => {
                  const startTime = new Date(event.start_time);
                  const priorityColors = {
                    'urgent': '#FF4444',
                    'high': '#FF8800',
                    'medium': '#4488FF',
                    'low': '#888888',
                  };
                  const color = priorityColors[event.priority] || '#4488FF';

                  return (
                    <div 
                      key={event.id} 
                      className={styles.eventCard}
                      onClick={() => {
                        if (!startLocation && !selectedCampus) {
                          setStartLocation({ lng: event.longitude, lat: event.latitude });
                          map.current?.flyTo({
                            center: [event.longitude, event.latitude],
                            zoom: 15,
                            pitch: 55,
                            duration: 1200
                          });
                        } else if (selectedCampus && !startLocation) {
                          setStartLocation({
                            lng: selectedCampus.coords[0],
                            lat: selectedCampus.coords[1]
                          });
                          setCustomDestination({
                            lng: event.longitude,
                            lat: event.latitude,
                            name: event.title,
                            address: event.location
                          });
                          setSelectedCampus(null);
                          map.current?.flyTo({
                            center: [event.longitude, event.latitude],
                            zoom: 15,
                            pitch: 55,
                            duration: 1200
                          });
                        } else {
                          setCustomDestination({
                            lng: event.longitude,
                            lat: event.latitude,
                            name: event.title,
                            address: event.location
                          });
                          setSelectedCampus(null);
                          map.current?.flyTo({
                            center: [event.longitude, event.latitude],
                            zoom: 15,
                            pitch: 55,
                            duration: 1200
                          });
                        }
                      }}
                    >
                      <div 
                        className={styles.eventPriorityBar}
                        style={{ backgroundColor: color }}
                      />
                      <div className={styles.eventCardContent}>
                        <div className={styles.eventCardHeader}>
                          <span className={styles.eventTime}>
                            {startTime.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span
                            className={styles.eventPriority}
                            style={{ color: color }}>
                              {event.priority}
                            </span>
                        </div>
                        <div className={styles.eventTitle}>{event.title}</div>
                        <div className={styles.eventLocation}>📍 {event.location}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {calendarEvents.length > 3 && (
                <button
                  className={styles.showMoreBtn}
                  onClick={() => setShowAllEvents(!showAllEvents)}>
                    {showAllEvents ? (
                      <>
                        Show Less <span>▲</span>
                      </>
                    ) : (
                      <>
                        Show {calendarEvents.length - 3} More <span>▼</span>
                      </>
                    )}
                  </button>
              )}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.stepBadge}>1</span>
            Starting Location
          </div>

          {startLocation ? (
            <div className={styles.locationChip}>
              <div
                className={styles.locationChipDot}
                style={{ background: "#4A3421" }}
              />
              <div className={styles.locationChipText}>
                <span className={styles.locationCoords}>
                  {startLocation.lat.toFixed(5)}, {startLocation.lng.toFixed(5)}
                </span>
                <span className={styles.locationHint}>My location</span>
              </div>
              <button
                className={styles.clearBtn}
                onClick={handleClearStart}
                title="Clear"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className={styles.hintText}>
              Click a point on the map to set a starting position.
            </p>
          )}

          <button
            className={styles.geoBtn}
            onClick={handleGeolocate}
            disabled={locating}
          >
            {locating ? (
              <>
                <span className={styles.spinner} /> Locating…
              </>
            ) : (
              <>
                <span>📍</span> Set My Current Location
              </>
            )}
          </button>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.stepBadge}>2</span>
            Destination
          </div>

          {customDestination ? (
            <div className={styles.locationChip}>
              <div
                className={styles.locationChipDot}
                style={{ background: "#FF6B6B" }}
              />
              <div className={styles.locationChipText}>
                <span className={styles.locationCoords}>
                  {customDestination.name}
                </span>
                <span className={styles.locationHint}>
                  {customDestination.address}
                </span>
              </div>
              <button
                className={styles.clearBtn}
                onClick={() => setCustomDestination(null)}
                title="Clear"
              >
                ✕
              </button>
            </div>
          ) : selectedCampus ? (
            <div className={styles.locationChip}>
              <div
                className={styles.locationChipDot}
                style={{background: selectedCampus.color}}
              />
              <div className={styles.locationChipText}>
                <span className={styles.locationCoords}>
                  {selectedCampus.name}
                </span>
                <span className={styles.locationHint}>
                  {selectedCampus.address}
                </span>
              </div>
              <button
                className={styles.clearBtn}
                onClick={handleClearCampus}
                title="Clear"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className={styles.hintText}>
              Select a campus or event as destination
            </p>
          )}

          <div className={styles.campusList}>
            {KCL_CAMPUSES.map((campus) => (
              <button
                key={campus.id}
                className={`${styles.campusBtn} ${selectedCampus?.id === campus.id ? styles.campusBtnActive : ""}`}
                onClick={() => {
                  setSelectedCampus(campus);
                  flyToCampus(campus);
                }}
              >
                <span
                  className={styles.campusDot}
                  style={{ background: campus.color }}
                />
                <span>{campus.shortName}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 — Transport Modes */}
        <section className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.stepBadge}>3</span>
            Transport Modes
          </div>

          {!startLocation || (!selectedCampus && !customDestination) ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🚶</span>
              <p>
                Set a starting location and destination to see your journey
                options!
              </p>
            </div>
          ) : loadingRoute ? (
            <div className={styles.loadingRoute}>
              <span className={styles.spinner} />
              <span>Calculating route…</span>
            </div>
          ) : routeError ? (
            <div className={styles.routeError}>{routeError}</div>
          ) : routeInfo ? (
            <>
              {/* Walking card */}
              <div className={styles.modeCard}>
                <div className={styles.modeCardHeader}>
                  <span className={styles.modeIcon}>🚶</span>
                  <div className={styles.modeInfo}>
                    <span className={styles.modeName}>Walking</span>
                    <span className={styles.modeBadge}>Available now</span>
                  </div>
                </div>
                <div className={styles.modeStats}>
                  <div className={styles.modeStat}>
                    <span className={styles.modeStatValue}>
                      {travelTime(routeInfo.duration)}
                    </span>
                    <span className={styles.modeStatLabel}>Duration</span>
                  </div>
                  <div className={styles.modeStatDivider} />
                  <div className={styles.modeStat}>
                    <span className={styles.modeStatValue}>
                      {travelDistance(routeInfo.distance)}
                    </span>
                    <span className={styles.modeStatLabel}>Distance</span>
                  </div>
                </div>

                <button
                  className={styles.stepsToggle}
                  onClick={() => setInstructionMode(!instructionMode)}
                >
                  {instructionMode ? "Hide" : "Show"} directions
                  <span>{instructionMode ? "▲" : "▼"}</span>
                </button>

                {instructionMode && (
                  <ol className={styles.stepsList}>
                    {routeInfo.steps.map((step, i) => (
                      <li key={i} className={styles.stepItem}>
                        <span className={styles.stepIndex}>{i + 1}</span>
                        <div className={styles.stepContent}>
                          <span className={styles.stepInstruction}>
                            {step.instruction}
                          </span>
                          <span className={styles.stepMeta}>
                            {travelDistance(step.distance)} ·{" "}
                            {travelTime(step.duration)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* TFL API TRANSPORT MODES */}
              {loadingTflRoute ? (
                <div className={styles.modeCard}>
                  <div className={styles.loadingRoute}>
                    <span className={styles.spinner} />
                    <span>Checking public transport...</span>
                  </div>
                </div>
              ) : tflRouteError ? (
                <div className={styles.modeCard}>
                  <div className={styles.modeCardHeader}>
                    <span className={styles.modeIcon}>🚇</span>
                    <div className={styles.modeInfo}>
                      <span className={styles.modeName}>Public Transport</span>
                    </div>
                  </div>
                  <p className={styles.routeError}>{tflRouteError}</p>
                </div>
              ) : tflRouteInfo ? (
                <div className={styles.modeCard}>
                  <div className={styles.modeCardHeader}>
                    <span className={styles.modeIcon}>🚇</span>
                    <div className={styles.modeInfo}>
                      <span className={styles.modeName}>Public Transport</span>
                      <span className={styles.modeBadge}>
                        Bus, Tube and Rail
                      </span>
                    </div>
                  </div>
                  <div className={styles.modeStats}>
                    <div className={styles.modeStat}>
                      <span className={styles.modeStatValue}>
                        {tflRouteInfo.duration} min
                      </span>
                      <span className={styles.modeStatLabel}>Duration</span>
                    </div>
                    <div className={styles.modeStatDivider} />
                    <div className={styles.modeStat}>
                      <span className={styles.modeStatValue}>
                        {tflRouteInfo.legs.length}
                      </span>
                      <span className={styles.modeStatLabel}>Stops</span>
                    </div>
                  </div>

                  <button
                    className={styles.stepsToggle}
                    onClick={() => setTflInstructionMode(!tflInstructionMode)}
                  >
                    {tflInstructionMode ? "Hide" : "Show"} step-by-step
                    directions
                    <span>{tflInstructionMode ? "▲" : "▼"}</span>
                  </button>

                  {tflInstructionMode && (
                    <div className={styles.tflJourneySteps}>
                      {tflRouteInfo.legs.map((leg, i) => (
                        <div key={i} className={styles.tflLeg}>
                          <div className={styles.tflLegIcon}>
                            {leg.mode === "walking"
                              ? "🚶"
                              : leg.mode === "bus"
                                ? "🚌"
                                : leg.mode === "tube"
                                  ? "🚇"
                                  : leg.mode === "dlr"
                                    ? "🚊"
                                    : leg.mode === "overground"
                                      ? "🚆"
                                      : leg.mode === "national-rail"
                                        ? "🚄"
                                        : "🚇"}
                          </div>
                          <div className={styles.tflLegContent}>
                            <span className={styles.tflLegMode}>
                              {leg.mode === "walking"
                                ? "Walk"
                                : leg.mode === "bus"
                                  ? `Bus ${leg.routeOptions[0]?.name || ""}`
                                  : leg.routeOptions[0]?.name || leg.mode}
                            </span>
                            <span className={styles.tflLegDetail}>
                              {leg.departurePoint} → {leg.arrivalPoint}
                            </span>
                            <span className={styles.tflLegTime}>
                              {leg.duration} min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <div className={styles.sidebarFooter}>
          <p>💡 Right-click + drag to rotate</p>
        </div>
      </motion.aside>

      <div className={styles.mapWrapper}>
        <div ref={mapContainer} className={styles.mapContainer} />

        {/* Floating campus quick-fly buttons */}
        <div className={styles.campusQuickNav}>
          {KCL_CAMPUSES.map((campus) => (
            <button
              key={campus.id}
              className={styles.quickNavBtn}
              onClick={() => flyToCampus(campus)}
              title={campus.name}
            >
              <span
                className={styles.quickNavDot}
                style={{ background: campus.color }}
              />
              {campus.shortName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
