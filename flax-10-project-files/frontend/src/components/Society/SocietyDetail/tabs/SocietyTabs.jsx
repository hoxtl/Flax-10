import styles from "./SocietyTabs.module.css";
import CalendarTab from "./calendarTab/CalendarTab";
import AboutTab from "./AboutTab";
import PhotosTab from "./PhotosTab";
import AnnouncementsTab from "./announcementTab/AnnouncementsTab";

const TABS = [
    { id: "calendar", label: "Calendar" },
    { id: "about", label: "About" },
    { id: "photos", label: "Photos" },
    { id: "announcements", label: "Announcements" }
];

export default function SocietyTabs({ activeTab, onTabChange, society, editMode, onUpdate, eventHandlers, tags, tagHandlers }) {
    return (
        <div className={styles.container}>
            <TabBar activeTab={activeTab} onTabChange={onTabChange} />
            <TabContent activeTab={activeTab} society={society} editMode={editMode}
                onUpdate={onUpdate} eventHandlers={eventHandlers} tags={tags} tagHandlers={tagHandlers} onTabChange={onTabChange} />
        </div>
    );
}

function TabBar({ activeTab, onTabChange }) {
    return (
        <div className={styles.tabBar}>
            {TABS.map(tab => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={() => onTabChange(tab.id)} />)}
        </div>
    );
}

function TabButton({ tab, isActive, onClick }) {
    const className = isActive ? `${styles.tab} ${styles.active}` : styles.tab;
    return <button className={className} onClick={onClick}>{tab.label}</button>;
}

function TabContent({ activeTab, society, editMode, onUpdate, eventHandlers, tags, tagHandlers, onTabChange }) {
    if (activeTab === 'about') return <TabWrapper><AboutTab about={society.about} editMode={editMode} onUpdate={(text) => onUpdate?.({ about: text })} /></TabWrapper>;
    if (activeTab === 'photos') return <TabWrapper><PhotosTab society={society} editMode={editMode} onUpdate={onUpdate} /></TabWrapper>;
    if (activeTab === 'announcements') return <TabWrapper><AnnouncementsTab announcements={society.announcements} editMode={editMode} onUpdate={onUpdate} tags={tags} /></TabWrapper>;
    return <TabWrapper><CalendarTab events={society.events} editMode={editMode} eventHandlers={eventHandlers}
        tags={tags} tagHandlers={tagHandlers} onViewAnnouncement={() => onTabChange('announcements')} /></TabWrapper>;
}

function TabWrapper({ children }) {
    return <div className={styles.content}>{children}</div>;
}
