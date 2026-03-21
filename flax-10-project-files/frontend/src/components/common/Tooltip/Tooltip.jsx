/*
 * Portal-based tooltip that positions itself relative to its trigger element.
 */

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

function getFixedStyle(position, rect) {
  const gap = 8;
  switch (position) {
    case 'bottom': return { top: rect.bottom + gap, left: rect.left + rect.width / 2 };
    case 'left': return { top: rect.top + rect.height / 2, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
    case 'right': return { top: rect.top + rect.height / 2, left: rect.right + gap, transform: 'translateY(-50%)' };
    default: return { bottom: window.innerHeight - rect.top + gap, left: rect.left + rect.width / 2 };
  }
}

function TooltipPortal({ content, position, rect }) {
  if (!rect || !content) return null;
  return createPortal(
    <div className={`${styles.tooltip} ${styles[position]}`} role="tooltip"
      style={{ position: 'fixed', ...getFixedStyle(position, rect) }}>
      {content}
    </div>,
    document.body
  );
}

/** Tooltip that appears on hover, rendered via a portal to avoid clipping. */
export default function Tooltip({ content, children, position = 'top' }) {
  const [rect, setRect] = useState(null);
  const wrapperRef = useRef(null);
  return (
    <div ref={wrapperRef} className={styles.wrapper}
      onMouseEnter={() => setRect(wrapperRef.current?.getBoundingClientRect())}
      onMouseLeave={() => setRect(null)}>
      {children}
      <TooltipPortal content={content} position={position} rect={rect} />
    </div>
  );
}
