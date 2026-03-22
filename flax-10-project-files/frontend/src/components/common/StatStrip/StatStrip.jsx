/*
 * Horizontal strip of labelled statistics with optional tone colouring.
 */

import { Fragment } from 'react';
import Tooltip from '../Tooltip/Tooltip';
import styles from './StatStrip.module.css';

const TONE_CLASS = {
  success: styles.valueSuccess,
  danger: styles.valueDanger,
  warning: styles.valueWarning,
  accent: styles.valueAccent,
};

function buildValueClass(item) {
  return [styles.value, item.tone ? TONE_CLASS[item.tone] : '', item.valueClassName || '']
    .filter(Boolean).join(' ');
}

function buildMetaClass(item) {
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

function StatItem({ item }) {
  const content = <StatItemContent item={item} />;
  if (item.tooltip) {
    return (
      <Tooltip content={item.tooltip} position={item.tooltipPosition || 'top'} wrapperClassName={`${styles.itemSlot} ${styles.itemTooltipWrap}`}>
        {content}
      </Tooltip>
    );
  }
  return <div className={styles.itemSlot}>{content}</div>;
}

/** Horizontal row of stats, each with a value, label, and optional colour tone. */
export default function StatStrip({ items = [], className = '', compact = false, bare = false }) {
  if (!items.length) return null;
  return (
    <div className={[styles.strip, compact ? styles.stripCompact : '', bare ? styles.stripBare : '', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => (
        <Fragment key={item.key || item.label}>
          <StatItem item={item} />
          {index < items.length - 1 ? <div className={styles.sep} aria-hidden /> : null}
        </Fragment>
      ))}
    </div>
  );
}
