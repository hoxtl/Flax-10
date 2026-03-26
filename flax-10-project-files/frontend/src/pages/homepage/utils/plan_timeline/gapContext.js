/*
 * Gap-context classification for plan timeline free rows.
 */

import { DAY_START_HOUR } from "./constants";
import { getCampusKey, getTransitMins } from "./campus";

const PERSONAL_CATEGORIES = new Set(["social", "routine", "admin", "wellness"]);

function getEventCategory(item) {
  const title = (item?.title || "").toLowerCase();
  const tag = (item?.tag_name ?? item?.tag?.name ?? "").toString().toLowerCase();
  if (/lecture|seminar|tutorial|lab\s*session|practical|workshop/i.test(title) || item?.source === "timetable") return "lecture";
  if (/study|revision|library|exam|coursework|essay|assignment|group project/i.test(title) || /academic|study/i.test(tag)) return "academic";
  if (/breakfast|lunch|dinner|sleep|brunch|snack|meal/i.test(title) || tag === "routine") return "routine";
  if (/gym|run|yoga|walk|sport|exercise|basketball|jog|stretch|medit|swim/i.test(title) || tag === "wellness") return "wellness";
  if (/coffee|costa|pret|drinks|pub|cinema|birthday|facetime|call|phone|catch up|meet with|restaurant|bar/i.test(title) || tag === "social") return "social";
  if (/shop|tesco|lidl|grocery|laundry|clean|tidy|parcel|delivery|haircut|barber|rent|bills|post office|dentist|doctor|gp|inpost/i.test(title) || tag === "admin") return "admin";
  return "neutral";
}

function buildTransitContext(prevItem, nextItem, gapMins, transitMins) {
  const prevCampus = getCampusKey(prevItem?.location);
  const nextCampus = getCampusKey(nextItem?.location);
  const buffer = transitMins + 10;
  if (gapMins <= buffer) return { type: "transit", transitMins, prevCampus, nextCampus };
  return { type: "transit-partial", transitMins, freeAfterTransit: gapMins - transitMins, prevCampus, nextCampus };
}

function isEveningGap(gapStartMins) {
  return gapStartMins >= (18 - DAY_START_HOUR) * 60;
}

function isPersonalGap(prevItem, nextItem) {
  return PERSONAL_CATEGORIES.has(getEventCategory(prevItem)) && PERSONAL_CATEGORIES.has(getEventCategory(nextItem));
}

export function computeGapContext(prevItem, nextItem, gapStartMins, gapMins) {
  const transitMins = getTransitMins(prevItem?.location, nextItem?.location);
  if (transitMins > 0) return buildTransitContext(prevItem, nextItem, gapMins, transitMins);
  if (isEveningGap(gapStartMins)) return { type: "evening" };
  if (isPersonalGap(prevItem, nextItem)) return { type: "personal" };
  return { type: "study" };
}
