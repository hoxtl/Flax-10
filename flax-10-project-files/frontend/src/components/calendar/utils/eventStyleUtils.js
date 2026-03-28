/**
 * eventStyleUtils - Event theming based on tags and event type.
 * Resolves colors and icons for event display.
 */

import { getEffectiveTagName } from "./eventUtils";

/** Returns color and icon theme for an event based on its tag. */

export function getEventTheme(event, tags) {
    if (event.tag_color) return { color: event.tag_color, icon: '🏷️' };
    const tagName = getEffectiveTagName(event);
    const tag = resolveTagByName(tagName, tags);
    if (tag) return { color: tag.color, icon: tag.icon };
    return { color: event.society_color || 'var(--color-caramel)', icon: '🏷️' };
}

/**
 * Resolves a tag object by name from either a tag context or a raw array wrapper.
 * @param {string} tagName
 * @param {{ getTagByName: (name: string) => object|null } | { tags: object[] }} tagsCtx
 *   Accepts a context object with a getTagByName method, or a plain object with a tags array.
 */

function resolveTagByName(tagName, tagsCtx) {
    if (!tagsCtx || !tagName) return null;
    if (typeof tagsCtx.getTagByName === 'function') return tagsCtx.getTagByName(tagName);

    const tags = Array.isArray(tagsCtx.tags) ? tagsCtx.tags : [];
    const lower = String(tagName).toLowerCase();
    return tags.find((t) =>
        String(t?.label || t?.name || '').toLowerCase() === lower
    ) || null;
}