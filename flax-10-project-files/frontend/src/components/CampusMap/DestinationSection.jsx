import styles from '../../pages/CampusMap/CampusMap.module.css';
import { LocationChip } from './LocationChip';
import { KCL_CAMPUSES } from '../../lib/kclCampuses';

function CampusList({ selectedCampus, onSelectCampus }) {
  return (
    <div className={styles.campusList}>
      {KCL_CAMPUSES.map((campus) => (
        <button
          key={campus.id}
          className={`${styles.campusBtn} ${selectedCampus?.id === campus.id ? styles.campusBtnActive : ''}`}
          onClick={() => onSelectCampus(campus)}
        >
          <span className={styles.campusDot} style={{ background: campus.color }} />
          <span>{campus.shortName}</span>
        </button>
      ))}
    </div>
  );
}

export function DestinationSection({ selectedCampus, customDestination, onClearCampus, onClearCustomDest, onSelectCampus }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.stepBadge}>2</span>
        Destination
      </div>
      {customDestination ? (
        <LocationChip
          dotColor="#FF6B6B"
          title={customDestination.name}
          subtitle={customDestination.address}
          onClear={onClearCustomDest}
        />
      ) : selectedCampus ? (
        <LocationChip
          dotColor={selectedCampus.color}
          title={selectedCampus.name}
          subtitle={selectedCampus.address}
          onClear={onClearCampus}
        />
      ) : (
        <p className={styles.hintText}>Select a campus or event as destination</p>
      )}
      <CampusList selectedCampus={selectedCampus} onSelectCampus={onSelectCampus} />
    </section>
  );
}
