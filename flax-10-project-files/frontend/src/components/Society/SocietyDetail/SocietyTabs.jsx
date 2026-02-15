import styles from "./SocietyTabs.module.css";
import CalendarTab from "./tabs/CalendarTab";
import AboutTab from "./tabs/AboutTab";
import PhotosTab from "./tabs/PhotosTab";
import AnnouncementsTab from "./tabs/AnnouncementsTab";

const TABS = [
    { id: "calendar", label: "Calendar" },
    { id: "about", label: "About" },
    { id: "photos", label: "Photos" },
    { id: "announcements", label: "Announcements" }
];

export default function SocietyTabs({ activeTab, onTabChange, details, editMode, onUpdateDetails, tags }) {
    return (
        <div className={styles.container}>
            <TabBar activeTab={activeTab} onTabChange={onTabChange} />
            <TabContent activeTab={activeTab} details={details} editMode={editMode} onUpdate={onUpdateDetails} tags={tags} />
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

function TabContent({ activeTab, details, editMode, onUpdate, tags }) {
    if (activeTab === 'about') return <TabWrapper><AboutTab details={details} editMode={editMode} onUpdate={(text) => onUpdate?.({ about: text })} /></TabWrapper>;
    if (activeTab === 'photos') return <TabWrapper><PhotosTab details={details} editMode={editMode} onUpdate={onUpdate} /></TabWrapper>;
    if (activeTab === 'announcements') return <TabWrapper><AnnouncementsTab details={details} editMode={editMode} onUpdate={onUpdate} tags={tags} /></TabWrapper>;
    return <TabWrapper><CalendarTab details={details} editMode={editMode} /></TabWrapper>;
}

function TabWrapper({ children }) {
    return <div className={styles.content}>{children}</div>;
}
