/**
 * Event/schedule shape used by calendar, Right Now widget, and contextual travel.
 * Backend may return additional fields; these are the ones used for schedule + commute logic.
 *
 * @typedef {Object} ScheduleEvent
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [start_time] - ISO date-time
 * @property {string} [end_time] - ISO date-time
 * @property {string} [location] - e.g. "Strand Campus", "Room 214"
 * @property {string[]} [travelLines] - TfL line names for commute (e.g. ["Northern", "District"])
 * @property {string[]} [commuteLines] - Alias for travelLines / TfL line IDs for this event's route
 * @property {number} [commuteTimeMinutes] - Estimated commute duration in minutes
 * @property {number} [commuteMinutes] - Alias for commuteTimeMinutes
 * @property {*} [tag]
 * @property {number[]} [reminder_minutes]
 * @property {boolean} [all_day]
 * @property {boolean} [is_private]
 * @property {*} [recurrence_details]
 * @property {string} [source]
 */

export const EVENT_SCHEDULE_FIELDS = [
  "id",
  "title",
  "description",
  "start_time",
  "end_time",
  "location",
  "travelLines",
  "commuteTimeMinutes",
  "tag",
  "reminder_minutes",
  "all_day",
  "is_private",
  "recurrence_details",
  "source",
];
