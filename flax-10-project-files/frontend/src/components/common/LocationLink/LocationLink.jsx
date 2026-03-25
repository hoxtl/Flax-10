/*
 * LocationLink - clickable map link for locations.
 */

import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./LocationLink.module.css";

const buildMapLink = (location) => `/map?destination=${encodeURIComponent(location)}`;

export default function LocationLink(props) {
  if (!props.location) return null;
  return (
    <Link
      to={props.to || buildMapLink(props.location)}
      className={`${styles.link} ${props.className ?? ""}`.trim()}
      aria-label={`Open UniMap for ${props.location}`}
      onClick={props.onClick}
    >
      {props.showIcon !== false && (
        <MapPin
          size={props.iconSize ?? 14}
          className={`${styles.icon} ${props.iconClassName ?? ""}`.trim()}
          aria-hidden="true"
        />
      )}
      <span className={`${styles.text} ${props.textClassName ?? ""}`.trim()}>{props.location}</span>
    </Link>
  );
}
