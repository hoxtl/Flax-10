/**
 * User settings / profile config shape.
 * Used by patchSettings, getUserSettings, and contextual travel (savedRoutes).
 *
 * @typedef {Object} SavedRouteEntry
 * @property {string[]} lines - TfL line IDs
 * @property {number} durationMinutes - Normal commute duration
 * @property {string} [alternatives] - e.g. "68 bus, 15 min walk from Waterloo"
 *
 * @typedef {Object} UserSettings
 * @property {string} [theme] - 'light' | 'dark' | 'system'
 * @property {string[]|Record<string, SavedRouteEntry>} [savedRoutes] - TfL line names for commute alerts, or map of locationKey → { lines, durationMinutes, alternatives }
 * @property {string} [first_name]
 * @property {string} [last_name]
 * @property {string} [year]
 * @property {string} [major]
 */

export const SETTINGS_SAVED_ROUTES_KEY = 'savedRoutes';
