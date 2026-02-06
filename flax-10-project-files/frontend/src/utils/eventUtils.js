/**
 * Creates a quick event at the given date and time.
 * @param {*} date 
 * @param {*} addEvent 
 */
export const createQuickEvent = async (date, addEvent) => {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);

    try {
        await addEvent({ title: "New Event", start_time: start.toISOString(), end_time: end.toISOString() });
    } catch (e) {
        alert("Check backend connection.");
    }
};