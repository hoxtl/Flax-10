/** SocietyTabs manages navigation between Calendar, About, and Announcements. */
import { TabBar } from "../../../Common/TabBar/TabBar";
import styles from "./SocietyTabs.module.css";
import CalendarTab from "./calendarTab/CalendarTab";
import AboutTab from "./AboutTab";
import AnnouncementsTab from "./announcementTab/AnnouncementsTab";

const TABS = [
    { id: "calendar", label: "Calendar" },
    { id: "about", label: "About" },
    { id: "announcements", label: "Announcements" }
];

export default function SocietyTabs(props) {
    const { activeTab, onTabChange, society, editMode, onUpdate, eventHandlers, announcementHandlers, tags, tagHandlers, focusAnnouncementId, onEditAnnouncement } = props;
    return (
        <div className={styles.container}>
            <TabBar tabs={TABS} activeTab={activeTab} onTabChange={onTabChange} layoutId="society-tab-underline" variant="compact" />
            <div className={styles.content}>{renderTabContent(activeTab, props)}</div>
        </div>
    );
}

function renderTabContent(activeTab, props) {
    const { society, editMode, onUpdate, eventHandlers, announcementHandlers, tags, tagHandlers, onTabChange, focusAnnouncementId, onEditAnnouncement } = props;
    if (activeTab === 'about') return <AboutTab about={society.about} adminEmails={society.admin_emails} editMode={editMode} onUpdate={(data) => onUpdate?.(data)} />;
    if (activeTab === 'announcements') return <AnnouncementsTab announcements={society.announcements} editMode={editMode} handlers={announcementHandlers} tags={tags} societyId={society.id} focusAnnouncementId={focusAnnouncementId} onEdit={onEditAnnouncement} />;
    return <CalendarTab events={society.events} editMode={editMode} eventHandlers={eventHandlers} tags={tags} tagHandlers={tagHandlers} onViewAnnouncement={(id) => onTabChange('announcements', id)} societyId={society.id} isMember={society.is_member} onEditAnnouncement={onEditAnnouncement} announcements={society.announcements} societyName={society.name} />;
}
