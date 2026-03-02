export function HighlightOverlay({ segment, segmentCount, type }) {
    if (segment === null) return null;
    const className = type === 'resize' ? 'resize-line-highlight' : 'quarter-highlight';
    const segmentHeight = `${100 / segmentCount}%`;
    return (
        <div className={className} style={{ top: `calc(${segmentHeight} * ${segment})`, '--segment-height': segmentHeight }} />
    );
}
