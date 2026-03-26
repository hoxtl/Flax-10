export function HighlightOverlay({ quarter, type }) {
    if (quarter === null) return null;
    const className = type === 'resize' ? 'resize-line-highlight' : 'quarter-highlight';
    return (
        <div className={className} style={{ top: `${quarter * 25}%` }} />
    );
}
