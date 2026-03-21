/**
 * eventStyleUtils - Event theming based on tags and event type.
 * Resolves colors and icons for event display.
 */
<<<<<<< HEAD

import { getEffectiveTagName } from "./eventUtils";

/** Returns color and icon theme for an event based on its tag. */

=======
import { getEffectiveTagName } from "./eventUtils";

/** Returns color and icon theme for an event based on its tag. */
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
export function getEventTheme(event, tags) {
    if (event.tag_color) return { color: event.tag_color, icon: '🏷️' };
    const tagName = getEffectiveTagName(event);
    const tag = resolveTagByName(tagName, tags);
    if (tag) return { color: tag.color, icon: tag.icon };
    return { color: event.society_color || 'var(--color-caramel)', icon: '🏷️' };
}

function resolveTagByName(tagName, tagsCtx) {
    if (!tagsCtx || !tagName) return null;
    if (typeof tagsCtx.getTagByName === 'function') return tagsCtx.getTagByName(tagName);

    const tags = Array.isArray(tagsCtx.tags) ? tagsCtx.tags : [];
    const lower = String(tagName).toLowerCase();
    return tags.find((t) =>
        String(t?.label || t?.name || '').toLowerCase() === lower
    ) || null;
}