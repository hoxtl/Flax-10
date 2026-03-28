/** SocietyTabs manages navigation between Calendar and Announcements. */

import Tabs from "../../../common/tabs/Tabs";
import styles from "./SocietyTabs.module.css";
import CalendarTab from "./calendar_tab/CalendarTab";
import AnnouncementsTab from "./announcement_tab/AnnouncementsTab";

const TABS = [
    { id: "calendar", label: "Calendar" },
    { id: "announcements", label: "Announcements" }
];

function buildCalendarTab(props) {
    return {
        id: "calendar",
        label: "Calendar",
        content: <CalendarTab events={props.society.events} editMode={props.editMode} eventHandlers={props.eventHandlers} tags={props.tags} tagHandlers={props.tagHandlers} onViewAnnouncement={(id) => props.onTabChange("announcements", id)} societyId={props.society.id} isMember={props.society.is_member} onEditAnnouncement={props.onEditAnnouncement} announcements={props.society.announcements} societyName={props.society.name} />,
    };
}

function buildAnnouncementsTab(props) {
    return {
        id: "announcements",
        label: "Announcements",
        content: <AnnouncementsTab announcements={props.society.announcements} editMode={props.editMode} handlers={props.announcementHandlers} tags={props.tags} societyId={props.society.id} focusAnnouncementId={props.focusAnnouncementId} onEdit={props.onEditAnnouncement} />,
    };
}

function buildTabs(props) {
    return [buildCalendarTab(props), buildAnnouncementsTab(props)];
}

function getSafeActiveTab(activeTab) {
    return TABS.some((tab) => tab.id === activeTab) ? activeTab : "calendar";
}

/** Switches between the calendar and announcements views for a society. */
export default function SocietyTabs(props) {
    return (
        <Tabs tabs={buildTabs(props)} activeTab={getSafeActiveTab(props.activeTab)} onTabChange={props.onTabChange} layoutId="society-tab" className={styles.container} tabClassName={styles.tabButton} />
    );
}
