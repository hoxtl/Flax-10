import styles from "./Profile.module.css";
import EditProfileModal from "../../components/Dashboard/EditProfileModal";
import { RANGE_OPTIONS, getRangeLabel, DATE_FORMAT, TIME_FORMAT } from "./utils/profileHelpers";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalContent}>{children}</div>
      </div>
    </div>
  );
}

function RangeButtons({ range, onRangeChange }) {
  return (
    <div className={styles.rangeSelector}>
      {RANGE_OPTIONS.map(([key, label]) => (
        <button
          key={key}
          className={range === key ? styles.rangeActive : ''}
          onClick={() => onRangeChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EventMeta({ startTime, location }) {
  const date = new Date(startTime);
  const dateStr = date.toLocaleDateString('en-GB', DATE_FORMAT);
  const timeStr = date.toLocaleTimeString('en-GB', TIME_FORMAT);
  return (
    <div className={styles.listMeta}>
      {dateStr} at {timeStr} {location ? `• ${location}` : ''}
    </div>
  );
}

function EventItem({ title, startTime, location }) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>📅</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{title}</div>
        <EventMeta startTime={startTime} location={location} />
      </div>
    </div>
  );
}

function EventsList({ events }) {
  if (events.length === 0) {
    return <p className={styles.emptyMessage}>No events found for this period</p>;
  }
  return events.map((event, i) => (
    <EventItem key={i} title={event.title} startTime={event.start_time} location={event.location} />
  ));
}

function EventsModal({ isOpen, onClose, events, range, onRangeChange }) {
  const title = `Events - ${getRangeLabel(range)} (${events.length})`;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <RangeButtons range={range} onRangeChange={onRangeChange} />
      <EventsList events={events} />
    </Modal>
  );
}

function ModuleItem({ code }) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>📚</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{code}</div>
        <div className={styles.listMeta}>Module</div>
      </div>
    </div>
  );
}

function ModulesModal({ isOpen, onClose, modules }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modules">
      {modules.length > 0
        ? modules.map((code, i) => <ModuleItem key={i} code={code} />)
        : <p className={styles.emptyMessage}>No modules found</p>}
    </Modal>
  );
}

function TasksModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tasks">
      <p className={styles.emptyMessage}>Tasks feature coming soon...</p>
    </Modal>
  );
}

function EditModals({ user, state, modules }) {
  const {
    showModules, setShowModules,
    showTasks, setShowTasks,
    showEditProfile, setShowEditProfile,
    handleSaveProfile, profileData,
  } = state;
  return (
    <>
      <EditProfileModal
        user={profileData || user}
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleSaveProfile}
      />
      <ModulesModal isOpen={showModules} onClose={() => setShowModules(false)} modules={modules} />
      <TasksModal isOpen={showTasks} onClose={() => setShowTasks(false)} />
    </>
  );
}

function EventsModalContainer({ state, filteredEvents }) {
  const { showEvents, setShowEvents, eventRange, setEventRange } = state;
  return (
    <EventsModal
      isOpen={showEvents}
      onClose={() => setShowEvents(false)}
      events={filteredEvents}
      range={eventRange}
      onRangeChange={setEventRange}
    />
  );
}

export default function ProfileModals({ user, state, modules, filteredEvents }) {
  return (
    <>
      <EditModals user={user} state={state} modules={modules} />
      <EventsModalContainer state={state} filteredEvents={filteredEvents} />
    </>
  );
}