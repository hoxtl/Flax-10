import styles from "./SocietiesPage.module.css";
import SocietyCard from "../../components/Society/SocietyCard";
import BrowseCard from "../../components/Society/BrowseCard";

export default function SocietySection({ title, items, type, onAction, allSocieties = [], onSelect }) {
    const isMember = type === "member";

    return (
        <section className={styles.section}>
            <SectionHeader title={title} type={type} onAction={onAction} />
            <SectionContent items={items} isMember={isMember} onAction={onAction} allSocieties={allSocieties} onSelect={onSelect} />
        </section>
    );
}

function SectionHeader({ title, type, onAction }) {
    const showPlus = type === "admin";

    return (
        <div className={styles.sectionHeader}>
            <h3>{title}</h3>
            {showPlus && <button className={styles.miniAddBtn} onClick={onAction}>+</button>}
        </div>
    );
}

function SectionContent({ items, isMember, onAction, allSocieties, onSelect }) {
    if (items.length === 0 && !isMember) {
        return <EmptyAdminState onAction={onAction} />;
    }

    return (
        <div className={styles.grid}>
            {items.map(s => <SocietyCard key={s.id} society={s} onClick={() => onSelect?.(s)} />)}
            {isMember && <BrowseCard onClick={onAction} societies={allSocieties} />}
        </div>
    );
}

function EmptyAdminState({ onAction }) {
    return (
        <div className={styles.miniEmptyState}>
            <p>You don't manage any societies yet.</p>
            <button className={styles.actionBtn} onClick={onAction}>Create a Society</button>
        </div>
    );
}
