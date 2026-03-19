import styles from '../../pages/CampusMap/CampusMap.module.css';
import { LocationChip } from './LocationChip';

export function LocationSection({ startLocation, locating, onGeolocate, onClear }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.stepBadge}>1</span>
        Starting Location
      </div>
      {startLocation ? (
        <LocationChip
          dotColor="var(--primary)"
          title={`${startLocation.lat.toFixed(5)}, ${startLocation.lng.toFixed(5)}`}
          subtitle="My location"
          onClear={onClear}
        />
      ) : (
        <p className={styles.hintText}>Click a point on the map to set a starting position.</p>
      )}
      <button className={styles.geoBtn} onClick={onGeolocate} disabled={locating}>
        {locating
          ? <><span className={styles.spinner} /> Locating…</>
          : <><span>📍</span> Set My Current Location</>}
      </button>
    </section>
  );
}
