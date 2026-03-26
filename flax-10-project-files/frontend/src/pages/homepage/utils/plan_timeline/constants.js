/*
 * Shared constants for plan timeline row computation.
 */

import { DAY_START_HOUR, DAY_END_HOUR, GAP_CARD_THRESHOLD_MINS, FIXED_ROW_GAP_PX } from "../timelineUtils";

export { DAY_START_HOUR, DAY_END_HOUR, GAP_CARD_THRESHOLD_MINS, FIXED_ROW_GAP_PX };

export const CAMPUS_DISPLAY = {
  strand: "Strand",
  waterloo: "Waterloo",
  guys: "Guy's",
  denmark: "Denmark Hill",
  stthomasw: "St Thomas'",
  kingssport: "King's Sport",
};

export const KCL_CAMPUS_KEYWORDS = {
  strand: ["strand", "somerset house", "bush house", "aldwych", "king's building", "kings building", "strand campus", "chancery lane", "king's college london"],
  waterloo: ["waterloo", "fwb", "franklin-wilkins", "franklin wilkins", "stamford street", "coin street"],
  guys: ["guy's", "guys campus", "london bridge", "st thomas street", "great maze pond"],
  denmark: ["denmark hill", "camberwell"],
  stthomasw: ["st thomas'", "st thomas ", "lambeth", "lambeth palace road", "westminster bridge"],
  kingssport: ["king's sport", "kings sport", "ethelburga", "honor oak"],
};

export const TRANSIT_MINS = {
  "strand-waterloo": 12, "waterloo-strand": 12,
  "strand-guys": 22, "guys-strand": 22,
  "strand-denmark": 38, "denmark-strand": 38,
  "strand-stthomasw": 12, "stthomasw-strand": 12,
  "waterloo-guys": 15, "guys-waterloo": 15,
  "waterloo-denmark": 25, "denmark-waterloo": 25,
  "waterloo-stthomasw": 8, "stthomasw-waterloo": 8,
  "guys-denmark": 25, "denmark-guys": 25,
  "guys-stthomasw": 20, "stthomasw-guys": 20,
  "denmark-stthomasw": 30, "stthomasw-denmark": 30,
};
