import { useState } from "react";
import styles from "./Profile.module.css";
import { getInitials } from "../utils/userUtils";
import EditProfileModal from "../components/EditProfileModal";

// Profile avatar
function ProfileAvatar({ user }) {
  const initials = getInitials(user?.name) || "?";

  return (
    <div className={styles.avatar}>
      {initials}
    </div>
  );
}

// Profile header
function ProfileHeader({ user, onModulesClick, onTasksClick, onEventsClick, onEditProfile }) {
    const fullName = user?.name || "Guest";
    const username = user?.username || "guest";
    const year = user?.year || "Year 2";
    const major = user?.major || "CS";
  
    return (
      <div className={styles.header}>
        <ProfileAvatar user={user} />
        <div className={styles.headerInfo}>
          <div className={styles.headerTop}>
            <h1 className={styles.username}>{username}</h1>
            <button className={styles.btnEdit} onClick={onEditProfile}>Edit profile</button>
          </div>
          <div className={styles.stats}>
            <StatItem value={8} label="modules" onClick={onModulesClick} />
            <StatItem value={15} label="tasks" onClick={onTasksClick} />
            <StatItem value={4} label="events" onClick={onEventsClick} />
          </div>
          <div className={styles.bio}>
            <div className={styles.fullName}>{fullName}</div>
            <div className={styles.description}>{year} · {major}</div>
          </div>
        </div>
      </div>
    );
  }

// Single stat item (clickable)
function StatItem({ value, label, onClick }) {
  return (
    <button className={styles.statButton} onClick={onClick}>
      <span className={styles.statValue}>{value}</span> {label}
    </button>
  );
}

// Module list item
function ModuleItem({ name, code }) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>📚</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{name}</div>
        <div className={styles.listMeta}>{code}</div>
      </div>
    </div>
  );
}

// Task list item
function TaskItem({ title, dueDate }) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>✓</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{title}</div>
        <div className={styles.listMeta}>Due {dueDate}</div>
      </div>
    </div>
  );
}

// Event list item
function EventItem({ title, date }) {
  return (
    <div className={styles.listItem}>
      <div className={styles.listAvatar}>📅</div>
      <div className={styles.listInfo}>
        <div className={styles.listName}>{title}</div>
        <div className={styles.listMeta}>{date}</div>
      </div>
    </div>
  );
}

// Modal overlay
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Get mock data
function getModules() {
  return [
    { name: "Software Engineering", code: "6CCS3PRJ" },
    { name: "Algorithms & Data Structures", code: "6CCS3ADS" },
    { name: "Database Systems", code: "6CCS3DB1" },
    { name: "Operating Systems", code: "6CCS3OS1" },
    { name: "Computer Networks", code: "6CCS3NET" },
    { name: "Machine Learning", code: "6CCS3ML1" },
    { name: "Computer Graphics", code: "6CCS3CG1" },
    { name: "Web Development", code: "6CCS3WEB" },
  ];
}

function getTasks() {
  return [
    { title: "Complete coursework 1", dueDate: "Feb 15" },
    { title: "Study for midterm", dueDate: "Feb 18" },
    { title: "Group project meeting", dueDate: "Feb 12" },
    { title: "Lab report submission", dueDate: "Feb 20" },
    { title: "Read chapter 5", dueDate: "Feb 14" },
  ];
}

function getEvents() {
  return [
    { title: "Lecture: Algorithms", date: "Today, 10:00 AM" },
    { title: "Lab: Database Systems", date: "Tomorrow, 2:00 PM" },
    { title: "Tutorial: Operating Systems", date: "Feb 12, 11:00 AM" },
    { title: "Guest Lecture", date: "Feb 15, 3:00 PM" },
  ];
}

// Main Profile page
export default function Profile({ user, onBack }) {
    const [showModules, setShowModules] = useState(false);
    const [showTasks, setShowTasks] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
  
    const modules = getModules();
    const tasks = getTasks();
    const events = getEvents();
  
    const handleEditProfile = () => {
      setShowEditProfile(true);
    };
  
    const handleSaveProfile = async (data) => {
      console.log("Saving profile:", data);
      // TODO: Call API to update profile
    };
  
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <ProfileHeader 
            user={user}
            onModulesClick={() => setShowModules(true)}
            onTasksClick={() => setShowTasks(true)}
            onEventsClick={() => setShowEvents(true)}
            onEditProfile={handleEditProfile}
          />
  
          <div className={styles.modulesGrid}>
            {modules.slice(0, 6).map((module, i) => (
              <div key={i} className={styles.moduleCard}>
                <div className={styles.moduleIcon}>📚</div>
                <div className={styles.moduleCode}>{module.code}</div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Edit Profile Modal */}
        <EditProfileModal
          user={user}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
  
        {/* List Modals */}
        <Modal isOpen={showModules} onClose={() => setShowModules(false)} title="Modules">
          {modules.map((module, i) => (
            <ModuleItem key={i} name={module.name} code={module.code} />
          ))}
        </Modal>
  
        <Modal isOpen={showTasks} onClose={() => setShowTasks(false)} title="Tasks">
          {tasks.map((task, i) => (
            <TaskItem key={i} title={task.title} dueDate={task.dueDate} />
          ))}
        </Modal>
  
        <Modal isOpen={showEvents} onClose={() => setShowEvents(false)} title="Events">
          {events.map((event, i) => (
            <EventItem key={i} title={event.title} date={event.date} />
          ))}
        </Modal>
      </div>
    );
  }