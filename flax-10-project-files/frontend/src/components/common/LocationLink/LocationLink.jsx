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

export default function LocationLink(props) {
  const reactNavigate = useNavigate();

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      props.onClick?.(e);
      // Trigger the app's sidebar navigation to the map page
      window.dispatchEvent(new CustomEvent("navigate", { detail: "map" }));
      // Also update the URL so useCampusMapModel reads ?destination=
      reactNavigate(props.to || buildMapPath(props.location), { replace: false });
    },
    [props, reactNavigate],
  );

  if (!props.location) return null;
  return (
    <button
      type="button"
      className={`${styles.link} ${props.className ?? ""}`.trim()}
      aria-label={`Open UniMap for ${props.location}`}
      onClick={handleClick}
    >
      {props.showIcon !== false && (
        <MapPin
          size={props.iconSize ?? 14}
          className={`${styles.icon} ${props.iconClassName ?? ""}`.trim()}
          aria-hidden="true"
        />
      )}
      <span className={`${styles.text} ${props.textClassName ?? ""}`.trim()}>{props.location}</span>
    </button>
  );
}
