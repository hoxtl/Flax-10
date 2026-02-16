import { useState } from 'react';
import { useCalendar, useCalendarDispatch, useEventModal } from "../../context/CalendarContext";
import { addDays, formatDate, getWeekDays, formatMonthYear } from './utils/dateUtils';
import { getEvents } from "../../api/event_api";
import { importTimetable } from "../../api/timetable_api";
import { getDateRangeForView } from "./hooks/calendarHelpers";
import { NavigationButtons } from "./header/NavigationButtons";
import { ViewModeToggle } from "./header/ViewModeToggle";
import TimetableImportModal from '../TimetableImportModal';
import './CalendarHeader.css';

export function CalendarHeader() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();
    const { openModal } = useEventModal();
    const [showImportModal, setShowImportModal] = useState(false);
    
    const navigate = (dir) => navigateDate(dispatch, selectedDate, viewMode, dir);
    const jumpToDate = (date) => dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    
    const handleImport = async (url) => {
        await importTimetable(url);
        await reloadEvents(dispatch, selectedDate, viewMode);
    };

    return (
        <>
            <div className="calendar-header">
                <NavigationButtons onNavigate={navigate} selectedDate={selectedDate} onDatePick={jumpToDate} />
                <h2 className="calendar-title">{getTitle(selectedDate, viewMode)}</h2>
                <HeaderActions 
                    openModal={openModal} 
                    viewMode={viewMode} 
                    selectedDate={selectedDate}
                    onImportClick={() => setShowImportModal(true)}
                />
            </div>
            
            <TimetableImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
            />
        </>
    );
}

function HeaderActions({ openModal, viewMode, selectedDate, onImportClick }) {
    const handleAddClick = () => openForView(openModal, viewMode, selectedDate);
    
    return (
        <div className="actions">
            <ImportButton onImport={onImportClick} />
            <button className="btn-add" onClick={handleAddClick}>+</button>
            <ViewModeToggle viewMode={viewMode} dispatch={useCalendarDispatch()} />
        </div>
    );
}

function ImportButton({ onImport }) {
    return (
        <div className="btn-import-wrapper">
            <button className="btn-import" onClick={onImport}>Import timetable</button>
            <span className="btn-import-tooltip">Import your timetable using the shareable link</span>
        </div>
    );
}

function navigateDate(dispatch, selectedDate, viewMode, dir) {
    if (viewMode === 'year') {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(newDate.getFullYear() + dir);
        dispatch({ type: 'SET_SELECTED_DATE', payload: newDate });
        return;
    }
    const days = { day: 1, week: 7, month: 30 }[viewMode] * dir;
    dispatch({ type: 'SET_SELECTED_DATE', payload: addDays(selectedDate, days) });
}

function getTitle(selectedDate, viewMode) {
    if (viewMode === 'day') return formatDate(selectedDate);
    if (viewMode === 'month') return formatMonthYear(selectedDate);
    if (viewMode === 'year') return selectedDate.getFullYear().toString();
    return getWeekTitle(selectedDate);
}

function getWeekTitle(selectedDate) {
    const week = getWeekDays(selectedDate);
    const fmt = { month: 'short', day: 'numeric' };
    return `${week[0].toLocaleDateString([], fmt)} – ${week[6].toLocaleDateString([], fmt)}`;
}

function openForView(openModal, viewMode, selectedDate) {
    if (viewMode === 'day') {
        openModal(null, null, selectedDate);
    } else {
        openModal();
    }
}

async function reloadEvents(dispatch, selectedDate, viewMode) {
    const { start, end } = getDateRangeForView(selectedDate, viewMode);
    const data = await getEvents({ start, end });
    dispatch({ type: 'SET_EVENTS', payload: data });
}
