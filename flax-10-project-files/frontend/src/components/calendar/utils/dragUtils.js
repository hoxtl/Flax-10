/**
 * Utility functions for handling drag and drop in the calendar.
 */

/**
 * Parses the drop event data and validates the type.
 * @param {object} e - The drop event.
 * @param {array} accept - An array of accepted types.
 * @returns {object|null} The parsed data if the type is accepted, null otherwise.
 */

export const parseDropPayload = (e, accept) => {
    try {
        const parsed = JSON.parse(e.dataTransfer.getData('application/json'));
        return accept.includes(parsed.type) ? parsed : null;
    } catch { return null; }
};

/**
 * Sets up the drag start event.
 * @param {object} e - The drag start event.
 * @param {string} type - The type of the data being dragged.
 * @param {object} data - The data being dragged.
 */

export const setupDragStart = (e, type, data) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, data }));
    e.dataTransfer.effectAllowed = 'move';
};

/**
 * Handles the drag over event.
 * @param {object} e - The drag over event.
 */

export const handleDragOverEffect = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};