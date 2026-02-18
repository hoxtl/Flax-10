import { Calendar } from '../components/Calendar/Calendar';
import PillFilters from '../components/Tags/PillFilters';
import { useCalendar, useCalendarDispatch, useEventModal, useEventPopup } from '../context/CalendarContext';
import styles from './CalendarPage.module.css';
import { EventModal } from '../components/Calendar/EventModal/EventModal';
import { EventDetailPopup } from '../components/Calendar/EventDetailPopup';
import { useTags } from '../context/TagContext';
import { useEventActions } from '../components/Calendar/hooks/useCalendarEvents';

export default function CalendarPage() {
    const { filter, allEvents } = useCalendar();
    const dispatch = useCalendarDispatch();
    const handleFilterChange = (key) => {
        dispatch({ type: 'SET_FILTER', payload: key });
    };
    return (
        <div className={styles.page}>
            <div className={styles.filters}>
                <PillFilters active={filter} onChange={handleFilterChange} items={allEvents} />
            </div>
            <Calendar />
            <EventModalContainer />
            <EventPopupContainer />
        </div>
    );
}

function EventModalContainer() {
    const { isModalOpen, closeModal, modalEvent, modalType, modalInitialDate } = useEventModal();
    if (!isModalOpen) return null;
    return (
        <EventModal
            event={modalEvent}
            onClose={closeModal}
            initialType={modalType}
            initialDate={modalInitialDate}
        />
    );
}

function EventPopupContainer() {
    const { popupEvent, popupAnchorRect, closePopup } = useEventPopup();
    const { isModalOpen, openModal } = useEventModal();
    const { removeEvent } = useEventActions();
    const tags = useTags();

    if (isModalOpen || !popupEvent) return null;

    const tag = getEventTag(popupEvent, tags);
    const actions = getCalendarPopupActions(popupEvent, openModal, removeEvent, closePopup);
    return <EventDetailPopup event={popupEvent} tag={tag} anchorRect={popupAnchorRect} onClose={closePopup} actions={actions} />;
}

function getEventTag(event, tags) {
    if (event.source === 'society' && event.tag_name) {
        return { label: event.tag_name, color: event.tag_color || event.society_color || '#9E7E5D' };
    }
    return tags.getTag(event.tag);
}

function getCalendarPopupActions(event, openModal, removeEvent, closePopup) {
    if (event.source === 'society') return null;
    return [
        { label: 'Edit', onClick: () => { closePopup(); openModal(event); } },
        { label: 'Delete', variant: 'danger', onClick: () => { closePopup(); removeEvent(event.id); } }
    ];
}