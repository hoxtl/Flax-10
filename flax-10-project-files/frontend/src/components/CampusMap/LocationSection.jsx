import baseStyles from '../../pages/CampusMap/CampusMap.module.css';
import sidebarStyles from '../../pages/CampusMap/sidebar.module.css';
import { LocationChip } from './LocationChip';
const styles = { ...baseStyles, ...sidebarStyles };

function GeoButton({ locating, onGeolocate }) {
  return (
    <button className={styles.geoBtn} onClick={onGeolocate} disabled={locating}>
      {locating
        ? <><span className={styles.spinner} /> Locating…</>
        : <><span>📍</span> Set My Current Location</>}
    </button>
  );
}

export function LocationSection({ startLocation, locating, onGeolocate, onClear }) {
  const coordsTitle = startLocation ? `${startLocation.lat.toFixed(5)}, ${startLocation.lng.toFixed(5)}` : null;
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}><span className={styles.stepBadge}>1</span> Starting Location</div>
      {coordsTitle
        ? <LocationChip dotColor="var(--primary)" title={coordsTitle} subtitle="My location" onClear={onClear} />
        : <p className={styles.hintText}>Click a point on the map to set a starting position.</p>}
      <GeoButton locating={locating} onGeolocate={onGeolocate} />
    </section>
  );
}
