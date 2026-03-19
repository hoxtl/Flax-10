import { useState } from 'react';
import styles from './Tooltip.module.css';

export default function Tooltip({ content, children, position = 'top' }) {
    const [visible, setVisible] = useState(false);

    return (
        <div
            className={styles.wrapper}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && content && (
                <div className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
                    {content}
                </div>
            )}
        </div>
    );
}
