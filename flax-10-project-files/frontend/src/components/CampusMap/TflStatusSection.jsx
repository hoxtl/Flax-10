/**
 * TfL status section for the campus map sidebar.
 */

import { useState } from 'react';
import baseStyles from '../../pages/CampusMap/CampusMap.module.css';
import statusStyles from '../../pages/CampusMap/status.module.css';
const styles = { ...baseStyles, ...statusStyles };

function DisruptionCard({ disruption }) {
  return (
    <div className={styles.disruptionCard}>
      <div className={styles.disruptionBadge} style={{ backgroundColor: disruption.color }}>
        - {disruption.lineName}
      </div>
      <div className={styles.disruptionContent}>
        <div className={styles.disruptionSeverity}>{disruption.severityDescription}</div>
        <div className={styles.disruptionReason}>{disruption.reason}</div>
      </div>
    </div>
  );
}

function GoodService() {
  return (
    <div className={styles.goodService}>
      <span className={styles.goodServiceIcon}>✅</span>
      <div className={styles.goodServiceText}>
        <strong>Good Service!</strong>
        <span>All TfL lines are running normally</span>
      </div>
    </div>
  );
}

function DisruptionsList({ disruptions }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? disruptions : disruptions.slice(0, 2);
  return (
    <>
      <div className={styles.disruptionsList}>
        {visible.map((d, i) => <DisruptionCard key={i} disruption={d} />)}
      </div>
      {disruptions.length > 2 && (
        <button className={styles.showMoreBtn} onClick={() => setShowAll(!showAll)}>
          {showAll
            ? <>Show Less <span>▲</span></>
            : <>Show {disruptions.length - 2} More <span>▼</span></>}
        </button>
      )}
    </>
  );
}

function StatusContent({ disruptions, loading }) {
  if (loading) return (
    <div className={styles.loadingDisruptions}>
      <span className={styles.spinner} />
      <span>Checking TfL Line status...</span>
    </div>
  );
  if (disruptions.length === 0) return <GoodService />;
  return <DisruptionsList disruptions={disruptions} />;
}

export function TflStatusSection({ disruptions, loading }) {
  const lastUpdated = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <section className={styles.section}>
      <div className={styles.sectionLabel}>
        <span className={styles.statusIcon}>⚠️</span>
        TfL Line Status
      </div>
      <StatusContent disruptions={disruptions} loading={loading} />
      <div className={styles.lastUpdated}>Last Updated: {lastUpdated}</div>
    </section>
  );
}
