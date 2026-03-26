/*
 * LocationLink - clickable map link for locations.
 * Dispatches the app's custom navigate event to open the UniMap page
 * and updates the URL so the map can read the ?destination= param.
 */

import { useCallback } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./LocationLink.module.css";

const buildMapPath = (location) => `/map?destination=${encodeURIComponent(location)}`;

function joinClassNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function useLocationLinkHandler(location, onClick, to) {
  const reactNavigate = useNavigate();
  return useCallback((event) => {
    event.preventDefault();
    onClick?.(event);
    window.dispatchEvent(new CustomEvent("navigate", { detail: "map" }));
    reactNavigate(to || buildMapPath(location), { replace: false });
  }, [location, onClick, reactNavigate, to]);
}

function LocationLinkButton({
  location,
  className,
  iconClassName,
  textClassName,
  showIcon = true,
  iconSize = 14,
  handleClick,
}) {
  return (
    <button type="button" className={joinClassNames(styles.link, className)} aria-label={`Open UniMap for ${location}`} onClick={handleClick}>
      {showIcon !== false && <MapPin size={iconSize} className={joinClassNames(styles.icon, iconClassName)} aria-hidden="true" />}
      <span className={joinClassNames(styles.text, textClassName)}>{location}</span>
    </button>
  );
}

export default function LocationLink({ location, className, iconClassName, textClassName, showIcon = true, iconSize = 14, onClick, to }) {
  const handleClick = useLocationLinkHandler(location, onClick, to);
  if (!location) return null;
  return <LocationLinkButton location={location} className={className} iconClassName={iconClassName} textClassName={textClassName} showIcon={showIcon} iconSize={iconSize} handleClick={handleClick} />;
}
