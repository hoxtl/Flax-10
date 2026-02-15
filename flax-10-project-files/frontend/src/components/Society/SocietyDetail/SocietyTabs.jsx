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

export default function SocietyTabs({ activeTab, onTabChange, details, editMode, onUpdateDetails }) {
    return (
        <div className={styles.container}>
            <TabBar activeTab={activeTab} onTabChange={onTabChange} />
            <TabContent activeTab={activeTab} details={details} editMode={editMode} onUpdate={onUpdateDetails} />
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

function TabContent({ activeTab, details, editMode, onUpdate }) {
    const components = {
        calendar: CalendarTab,
        about: AboutTab,
        photos: PhotosTab,
        announcements: AnnouncementsTab
    };

    const Component = components[activeTab];

    if (activeTab === 'about') {
        return <div className={styles.content}>
            <AboutTab details={details} editMode={editMode} onUpdate={(text) => onUpdate?.({ about: text })} />
        </div>;
    }

    if (activeTab === 'photos') {
        return <div className={styles.content}>
            <PhotosTab details={details} editMode={editMode} onUpdate={onUpdate} />
        </div>;
    }

    return <div className={styles.content}><Component details={details} editMode={editMode} /></div>;
}
