// Calendar Feature - Public Exports

// Main Calendar Views
export { default as Calendar } from './components/Calendar.jsx';

// Modals
export { default as AddEventModal } from './components/AddEventModal.jsx';
export { default as QuickAddModal } from './components/QuickAddModal.jsx';

// Components
export { default as CalendarHeader } from './components/CalendarHeader.jsx';
export { default as DateNavigator } from './components/DateNavigator.jsx';
export { default as DayCard } from './components/DayCard.jsx';
export { default as DraggableEvent } from './components/DraggableEvent.jsx';
export { default as CardGrid } from './components/CardGrid.jsx';
export { default as PillFilters } from './components/PillFilters.jsx';

// Context
export { CalendarProvider, useCalendarContext } from './context/CalendarContext.jsx';

// Hooks
export { default as useCalendarEvents } from './hooks/useCalendarEvents.js';
export { default as useDragDrop } from './hooks/useDragDrop.js';

// Store
export { default as eventsStore } from './store/eventsStore.js';
