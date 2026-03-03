export function getEventTheme(event, tags) {
    if (event.source === 'society') {
        return { color: event.society_color || '#9E7E5D', icon: '●' };
    }
    const tag = tags.getTag(event.tag);
    if (tag) return { color: tag.color, icon: tag.icon };
    return { color: '#9E7E5D', icon: '🏷️' };
}
