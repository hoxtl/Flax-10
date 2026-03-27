/*
 * Horizontal strip of labelled statistics with optional tone colouring.
 */

import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Tooltip from '../tooltip/Tooltip';
import styles from './StatStrip.module.css';

const TONE_CLASS = {
  success: styles.valueSuccess,
  danger: styles.valueDanger,
  warning: styles.valueWarning,
  accent: styles.valueAccent,
};

export function buildValueClass(item) {
  return [styles.value, item.tone ? TONE_CLASS[item.tone] : '', item.valueClassName || '']
    .filter(Boolean).join(' ');
}

export function buildMetaClass(item) {
  return [styles.meta, item.metaClassName || ''].filter(Boolean).join(' ');
}

function StatCopy({ item }) {
  return (
    <span className={styles.copy}>
      <span className={styles.label}>{item.label}</span>
      {item.meta ? <span className={buildMetaClass(item)}>{item.meta}</span> : null}
    </span>
  );
}

function StatItemContent({ item }) {
  return (
    <div className={styles.item}>
      <span className={buildValueClass(item)}>
        {item.prefix ? <span className={styles.valueAffix}>{item.prefix}</span> : null}
        <span className={styles.valueNumber} ref={item.valueRef}>{item.valueRef ? '0' : item.value}</span>
        {item.suffix ? <span className={styles.valueAffix}>{item.suffix}</span> : null}
      </span>
      <StatCopy item={item} />
    </div>
  );
}

export function buildItemSlotClass(item) {
  return [
    styles.itemSlot,
    item.to || item.onClick ? styles.itemSlotInteractive : '',
  ].filter(Boolean).join(' ');
}

export function ItemShell({ children, item }) {
  const className = buildItemSlotClass(item);
  const ariaLabel = item.ariaLabel || item.tooltip || item.label;
  if (item.to) {
    return <Link className={className} to={item.to} aria-label={ariaLabel}>{children}</Link>;
  }
  if (item.onClick) {
    return <button type="button" className={`${className} ${styles.itemButton}`.trim()} onClick={item.onClick} aria-label={ariaLabel}>{children}</button>;
  }
  return <div className={className}>{children}</div>;
}

function StatItem({ item }) {
  const content = <ItemShell item={item}><StatItemContent item={item} /></ItemShell>;
  if (item.tooltip) {
    return (
      <Tooltip content={item.tooltip} position={item.tooltipPosition || 'top'} wrapperClassName={`${styles.itemSlot} ${styles.itemTooltipWrap}`}>
        {content}
      </Tooltip>
    );
  }
  return content;
}

/** Horizontal row of stats, each with a value, label, and optional colour tone. */

export default function StatStrip({ items = [], className = '', compact = false, bare = false, nowrap = false }) {
  if (!items.length) return null;
  return (
    <div className={[styles.strip, compact ? styles.stripCompact : '', bare ? styles.stripBare : '', nowrap ? styles.stripNoWrap : '', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <Fragment key={item.key || item.label}>
          <StatItem item={item} />
          {index < items.length - 1 ? <div className={styles.sep} aria-hidden /> : null}
        </Fragment>
      ))}
    </div>
  );
}
