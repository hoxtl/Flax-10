/**
 * SocietyTabs manages the navigation between different content areas of a society profile:
 * Calendar, About information, and Announcements.
 */
import styles from "./SocietyTabs.module.css";
import CalendarTab from "./calendarTab/CalendarTab";
import AboutTab from "./AboutTab";
import AnnouncementsTab from "./announcementTab/AnnouncementsTab";

const TABS = [
    { id: "calendar", label: "Calendar" },
    { id: "about", label: "About" },
    { id: "announcements", label: "Announcements" }
];

export default function SocietyTabs({ activeTab, onTabChange, society, editMode, onUpdate, eventHandlers, announcementHandlers, tags, tagHandlers, focusAnnouncementId, onEditAnnouncement }) {
    return (
        <div className={styles.container}>
            <TabBar activeTab={activeTab} onTabChange={onTabChange} />
            <TabContent activeTab={activeTab} society={society} editMode={editMode}
                onUpdate={onUpdate} eventHandlers={eventHandlers} announcementHandlers={announcementHandlers}
                tags={tags} tagHandlers={tagHandlers} onTabChange={onTabChange}
                focusAnnouncementId={focusAnnouncementId}
                onEditAnnouncement={onEditAnnouncement} />
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

function TabContent({ activeTab, society, editMode, onUpdate, eventHandlers, announcementHandlers, tags, tagHandlers, onTabChange, focusAnnouncementId, onEditAnnouncement }) {
    if (activeTab === 'about') return <TabWrapper><AboutTab about={society.about} adminEmails={society.admin_emails} editMode={editMode} onUpdate={(data) => onUpdate?.(data)} /></TabWrapper>;
    if (activeTab === 'announcements') return <TabWrapper><AnnouncementsTab announcements={society.announcements} editMode={editMode} handlers={announcementHandlers} tags={tags} societyId={society.id} focusAnnouncementId={focusAnnouncementId} onEdit={onEditAnnouncement} /></TabWrapper>;
    return <TabWrapper><CalendarTab events={society.events} editMode={editMode} eventHandlers={eventHandlers}
        tags={tags} tagHandlers={tagHandlers} onViewAnnouncement={(id) => onTabChange('announcements', id)}
        societyId={society.id} isMember={society.is_member} onEditAnnouncement={onEditAnnouncement} announcements={society.announcements}
        societyName={society.name} /></TabWrapper>;
}

function TabWrapper({ children }) {
    return <div className={styles.content}>{children}</div>;
}
