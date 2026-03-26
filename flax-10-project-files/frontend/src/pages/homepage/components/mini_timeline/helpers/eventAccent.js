/*
 * Shared accent-color helpers for mini timeline event cards.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/helpers/eventAccent.js
import eventAccentColors from './eventAccentColors.json';

const EVENT_ACCENTS = eventAccentColors;
=======
const EVENT_ACCENTS = {
  lecture: "#7B9BAD",
  study: "#9A8CB0",
  routine: "#B8956A",
  wellness: "#7BB38E",
  social: "#C0714E",
  society: "#C4906A",
  meeting: "#A08B72",
  admin: "#C4A46D",
  default: "#A08B72",
};
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/helpers/eventAccent.js

const MATCHERS = [
  { key: "lecture", test: ({ title, tagName }) => tagName === "lecture" || /^lecture:/i.test(title) },
  { key: "routine", test: ({ lowerTitle, tagName }) => tagName === "routine" || /^(breakfast|lunch|dinner|sleep|brunch)$/i.test(lowerTitle) },
  { key: "wellness", test: ({ lowerTitle, tagName }) => tagName === "wellness" || /\b(gym|yoga|run|pilates|swim|sport|exercise)\b/.test(lowerTitle) },
  { key: "society", test: ({ lowerTitle, tagName }) => /kclsu|society/i.test(lowerTitle) || tagName === "society" },
  { key: "social", test: ({ lowerTitle, tagName }) => /coffee|pub|cinema|birthday|facetime|restaurant|bar|flatmates|friends/i.test(lowerTitle) || tagName === "social" },
  { key: "study", test: ({ lowerTitle, lowerTag }) => /\b(study|library|review|revision|coursework|essay|assignment)\b/.test(lowerTitle) || /academic|study/i.test(lowerTag) },
  { key: "meeting", test: ({ lowerTitle }) => /\b(meeting|seminar|tutorial|office hours|tutor)\b/.test(lowerTitle) },
  { key: "admin", test: ({ lowerTitle, tagName }) => /shop|tesco|laundry|clean|haircut|dentist|doctor|rent|bills/i.test(lowerTitle) || tagName === "admin" },
];

function getEventContext(title, tagName) {
  return {
    title: title || "",
    tagName: (tagName || "").toLowerCase(),
    lowerTitle: (title || "").toLowerCase(),
    lowerTag: (tagName || "").toLowerCase(),
  };
}

function findAccentKey(context) {
  return MATCHERS.find(({ test }) => test(context))?.key || "default";
}

export function getEventAccentColor(title, tagName) {
  const context = getEventContext(title, tagName);
  const accentKey = findAccentKey(context);
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Homepage/components/mini_timeline/helpers/eventAccent.js
  return EVENT_ACCENTS[accentKey];
=======
  return EVENT_ACCENTS[accentKey] || EVENT_ACCENTS.default;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/pages/Homepage/components/MiniTimeline/helpers/eventAccent.js
}
