import { Fragment } from 'react';
import styles from './StatStrip.module.css';

const TONE_CLASS = {
  success: styles.valueSuccess,
  danger: styles.valueDanger,
  warning: styles.valueWarning,
  accent: styles.valueAccent,
};

export default function StatStrip({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <div className={[styles.strip, className].filter(Boolean).join(' ')}>
      {items.map((item, index) => {
        const valueClassName = [
          styles.value,
          item.tone ? TONE_CLASS[item.tone] : '',
          item.valueClassName || '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Fragment key={item.key || item.label}>
            <div className={styles.item}>
              <span className={valueClassName}>
                {item.prefix ? <span className={styles.valueAffix}>{item.prefix}</span> : null}
                <span className={styles.valueNumber} ref={item.valueRef}>
                  {item.valueRef ? '0' : item.value}
                </span>
                {item.suffix ? <span className={styles.valueAffix}>{item.suffix}</span> : null}
              </span>
              <span className={styles.label}>{item.label}</span>
            </div>
            {index < items.length - 1 ? <div className={styles.sep} aria-hidden /> : null}
          </Fragment>
        );
      })}
    </div>
  );
}
