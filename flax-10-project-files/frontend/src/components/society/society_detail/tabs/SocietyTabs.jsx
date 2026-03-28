/** SocietyTabs manages navigation between Calendar and Announcements. */

import Tabs from "../../../common/tabs/Tabs";
import styles from "./SocietyTabs.module.css";
import CalendarTab from "./calendar_tab/CalendarTab";
import AnnouncementsTab from "./announcement_tab/AnnouncementsTab";

const TABS = [
    { id: "calendar", label: "Calendar" },
    { id: "announcements", label: "Announcements" }
];

export default function SocietyTabs(props) {
    const safeActiveTab = TABS.some((tab) => tab.id === props.activeTab) ? props.activeTab : "calendar";
    return (
        <Tabs
            tabs={buildTabs(props)}
            activeTab={safeActiveTab}
            onTabChange={props.onTabChange}
            layoutId="society-tab"
            className={styles.container}
            tabClassName={styles.tabButton}
        />
    );
}

function buildTabs(props) {
    const { society, editMode, eventHandlers, announcementHandlers, tags, tagHandlers, onTabChange, focusAnnouncementId, onEditAnnouncement } = props;
    return [
        {
            id: "calendar",
            label: "Calendar",
            content: (
                <CalendarTab
                    events={society.events}
                    editMode={editMode}
                    eventHandlers={eventHandlers}
                    tags={tags}
                    tagHandlers={tagHandlers}
                    onViewAnnouncement={(id) => onTabChange("announcements", id)}
                    societyId={society.id}
                    isMember={society.is_member}
                    onEditAnnouncement={onEditAnnouncement}
                    announcements={society.announcements}
                    societyName={society.name}
                />
            ),
        },
        {
            id: "announcements",
            label: "Announcements",
            content: (
                <AnnouncementsTab
                    announcements={society.announcements}
                    editMode={editMode}
                    handlers={announcementHandlers}
                    tags={tags}
                    societyId={society.id}
                    focusAnnouncementId={focusAnnouncementId}
                    onEdit={onEditAnnouncement}
                />
            ),
        },
    ];
}
