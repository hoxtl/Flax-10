import {useState, useEffect} from 'react';
import styles from './Pagination.module.css';
import {ArrowUp} from 'lucide-react';

export function Pagination({current_page, total_pages, onPageChange}) {
    if (total_pages <= 1) return null;
    return (
        <div className={styles.pagination}>
            <button className={styles.pageButton} onClick={() => onPageChange(current_page - 1)} disabled={current_page === 1}>← Previous</button>
            <span className={styles.pageIndicator}>Page {current_page} of {total_pages}</span>
            <button className={styles.pageButton} onClick={() => onPageChange(current_page + 1)} disabled={current_page === total_pages}>Next →</button>
        </div>
    );
}

export function BackToTop() {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const container = document.querySelector('[class*="content"]');
        if (!container) return;
        const onScroll = () => setVisible(container.scrollTop > 100);
        container.addEventListener('scroll', onScroll);
        return () => container.removeEventListener('scroll', onScroll);
    }, []);
    if (!visible) return null;
    return <button className={styles.backToTop} onClick={() => document.querySelector('[class*="content"]')?.scrollTo({top: 0, behavior: 'smooth'})}><ArrowUp size={16} /></button>;
}
