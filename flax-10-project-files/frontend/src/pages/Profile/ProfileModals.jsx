import { useState, useEffect } from "react";
import styles from "./Profile.module.css";
import EditProfileModal from "../../components/Dashboard/EditProfileModal";
import { getSharingWith, getSharedWithMe } from "../../api/socialService";
import UserListModal from "../../components/Social/UserListModal";
import { EventsSummaryModal } from "../../components/Calendar/EventsSummaryModal/EventsSummaryModal";

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


function ModuleItem({ code, onNavigate, onClose }) {
  return (
    <div
      className={styles.listItem}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={() => { onClose?.(); onNavigate?.(`modules_${code}`); }}
      onKeyDown={(e) => e.key === 'Enter' && (onClose?.(), onNavigate?.(`modules_${code}`))}
    >
      <div className={styles.listAvatar}>📚</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{code}</div>
        <div className={styles.listMeta}>Module</div>
      </div>
    </div>
  );
}

function ModulesModal({ isOpen, onClose, modules, onNavigate }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modules">
      {modules.length > 0
        ? modules.map((code, i) => <ModuleItem key={i} code={code} onNavigate={onNavigate} onClose={onClose} />)
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

function SocialDataModal({ isOpen, onClose, title, fetchFn, userId, onNavChange, onUserUpdate }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchFn(userId)
        .then(data => setUsers(data.results || data))
        .catch(err => console.error("Failed to fetch users", err));
    } else {
      setUsers([]);
    }
  }, [isOpen, userId, fetchFn]);

  if (!isOpen) return null;

  return (
    <UserListModal
      title={title}
      users={users}
      onClose={onClose}
      onUserClick={(u) => {
        onClose(); // close the modal first
        if (onNavChange) onNavChange(`profile_${u.id}`);
      }}
      onUserUpdate={onUserUpdate}
    />
  );
}

function EditProfileSection({ state }) {
  const { showEditProfile, setShowEditProfile, handleSaveProfile, profileData } = state;
  return (
    <EditProfileModal
      user={profileData}
      isOpen={showEditProfile}
      onClose={() => setShowEditProfile(false)}
      onSave={handleSaveProfile}
    />
  );
}

function EditModals({ user, state, modules, isMutualOrSelf, onNavChange }) {
  const { showModules, setShowModules, showTasks, setShowTasks, profileData } = state;
  return (
    <>
      {isMutualOrSelf && <EditProfileSection state={state} />}
      <ModulesModal isOpen={showModules} onClose={() => setShowModules(false)} modules={modules} onNavigate={onNavChange} />
      {isMutualOrSelf && <TasksModal isOpen={showTasks} onClose={() => setShowTasks(false)} />}

      <SocialDataModal
        isOpen={state.showSharedWith}
        onClose={() => state.setShowSharedWith(false)}
        title="Sharing With"
        fetchFn={getSharingWith}
        userId={(profileData || user)?.id}
        onNavChange={onNavChange}
        onUserUpdate={state.reload}
      />
      <SocialDataModal
        isOpen={state.showSharedBy}
        onClose={() => state.setShowSharedBy(false)}
        title="Shared By"
        fetchFn={getSharedWithMe}
        userId={(profileData || user)?.id}
        onNavChange={onNavChange}
        onUserUpdate={state.reload}
      />
    </>
  );
}

function EventsModalContainer({ state, allEvents, isMutualOrSelf }) {
  const { showEvents, setShowEvents } = state;
  if (!isMutualOrSelf) return null;

  return (
    <EventsSummaryModal
      isOpen={showEvents}
      onClose={() => setShowEvents(false)}
      allEvents={allEvents}
      isMutualOrSelf={isMutualOrSelf}
    />
  );
}

export default function ProfileModals({ user, state, modules, allEvents, isMutualOrSelf, onNavChange }) {
  return (
    <>
      <EditModals user={user} state={state} modules={modules} isMutualOrSelf={isMutualOrSelf} onNavChange={onNavChange} />
      <EventsModalContainer state={state} allEvents={allEvents} isMutualOrSelf={isMutualOrSelf} />
    </>
  );
}