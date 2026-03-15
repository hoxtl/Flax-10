import { getEffectiveTagName } from "./eventUtils";

export function getEventTheme(event, tags) {
    if (event.tag_color) return { color: event.tag_color, icon: '🏷️' };
    const tagName = getEffectiveTagName(event);
    const tag = resolveTagByName(tagName, tags);
    if (tag) return { color: tag.color, icon: tag.icon };
    return { color: event.society_color || '#9E7E5D', icon: '🏷️' };
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