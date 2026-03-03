import { getEffectiveTagName } from "./eventUtils";

export function getEventTheme(event, tags) {
    const tagName = getEffectiveTagName(event);
    const tag = tags.getTagByName(tagName);

    if (tag) return { color: tag.color, icon: tag.icon };

    // Fallback if tag doesn't exist
    return { color: event.society_color || '#9E7E5D', icon: '🏷️' };
}
