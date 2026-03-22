/*
 * Imports a timetable from an external source URL.
 */

import { fetchApi } from "../client";

export async function importTimetable(source_url) {
    return fetchApi("/timetable/import/", {
        method: "POST",
        body: JSON.stringify({ source_url }),
    });
}
