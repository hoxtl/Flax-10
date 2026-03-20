import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

function getFixedStyle(position, rect) {
    const gap = 8;
    switch (position) {
        case 'bottom':
            return { top: rect.bottom + gap, left: rect.left + rect.width / 2 };
        case 'left':
            return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
        case 'right':
            return { top: rect.top + rect.height / 2, left: rect.right + gap, transform: 'translateY(-50%)' };
        case 'top':
        default:
            return { bottom: window.innerHeight - rect.top + gap, left: rect.left + rect.width / 2 };
    }
}

export default function Tooltip({ content, children, position = 'top' }) {
    const [rect, setRect] = useState(null);
    const wrapperRef = useRef(null);

    const handleMouseEnter = () => {
        if (wrapperRef.current) {
            setRect(wrapperRef.current.getBoundingClientRect());
        }
    };

    return (
        <div
            ref={wrapperRef}
            className={styles.wrapper}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setRect(null)}
        >
            {children}
            {rect && content && createPortal(
                <div
                    className={`${styles.tooltip} ${styles[position]}`}
                    role="tooltip"
                    style={{ position: 'fixed', ...getFixedStyle(position, rect) }}
                >
                    {content}
                </div>,
                document.body
            )}
        </div>
    );
}
