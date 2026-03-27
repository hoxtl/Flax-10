/*
 * ActionCard renders the call-to-action card used in society grids.
 */

import styles from '../styles/ActionCard.module.css';

export default function ActionCard({ onClick, text, children, className = "" }) {
    return (
        <div className={`${styles.card} ${className}`} onClick={onClick}>
            {children}
            <div className={styles.overlay}>
                <span className={styles.text}>{text}</span>
            </div>
        </div>
    );
}
