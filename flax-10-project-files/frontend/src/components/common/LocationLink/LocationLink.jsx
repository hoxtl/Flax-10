/*
 * LocationLink - clickable map link for locations.
 */

import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./LocationLink.module.css";

const buildMapLink = (location) => `/map?destination=${encodeURIComponent(location)}`;

export default function LocationLink({
  location,
  className = "",
  textClassName = "",
  iconClassName = "",
  onClick,
  showIcon = true,
  iconSize = 14,
  to,
}) {
  if (!location) return null;
  const href = to || buildMapLink(location);
  const content = (
    <>
      {showIcon && (
        <MapPin size={iconSize} className={`${styles.icon} ${iconClassName}`.trim()} aria-hidden="true" />
      )}
      <span className={`${styles.text} ${textClassName}`.trim()}>{location}</span>
    </>
  );
  if (to) {
    return (
      <Link
        to={href}
        className={`${styles.link} ${className}`.trim()}
        aria-label={`Open UniMap for ${location}`}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }
  return (
    <Link
      to={href}
      className={`${styles.link} ${className}`.trim()}
      aria-label={`Open UniMap for ${location}`}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
