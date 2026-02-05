/**
 * Hook for resizing calendar events by dragging the bottom edge.
 * Tracks mouse movements and updates event duration in real-time.
 */
export function useEventResize(event, eventRef, editEvent) {
    const [isResizing, setIsResizing] = useState(false);
    const [resizePreview, setResizePreview] = useState(null); // Height during drag
    const handleResizeStart = useCallback((e) => {
        e.stopPropagation(); // Prevent triggering drag-to-move
        e.preventDefault();
        setIsResizing(true);
        const { clientY: startY } = e;
        const originalH = eventRef.current.offsetHeight;
        // Update preview height as mouse moves
        const onMove = (m) => setResizePreview(Math.max((MIN_EVENT_DURATION / 60) * SLOT_HEIGHT, originalH + m.clientY - startY));
        // Commit resize and cleanup listeners on mouse up
        const onUp = (u) => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); commitResize(event, u.clientY - startY, editEvent); setIsResizing(false); setResizePreview(null); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [event, editEvent]);
    return { isResizing, resizePreview, handleResizeStart };
}