import styles from "./SocietiesPage.module.css";
import SocietyCard from "../../components/Society/SocietyCard";
import BrowseCard from "../../components/Society/BrowseCard";
import CreateCard from "../../components/Society/CreateCard";
import { Pagination } from "../../components/Pagination/Pagination";

export default function SocietySection({ title, items, type, onAction, allSocieties = [], onSelect, onReport, onUnreport, hideTitle, pagination }) {
    return (
        <section className={styles.section}>
            {!hideTitle && <SectionHeader title={title} type={type} onAction={onAction} />}
            {pagination && <Pagination {...pagination} />}
            <SectionContent items={items} type={type} onAction={onAction} allSocieties={allSocieties} onSelect={onSelect} onReport={onReport} onUnreport={onUnreport} />
            {pagination && <Pagination {...pagination} />}
        </section>
    );
}

function SectionHeader({ title, type, onAction }) {
    const showPlus = type === "admin";
    return (
        <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            {showPlus && <button className={styles.miniAddBtn} onClick={onAction}>+</button>}
        </div>
    );
}

function SectionContent({ items, type, onAction, allSocieties, onSelect, onReport, onUnreport }) {
    const isMember = type === "member";
    const isAdmin = type === "admin";

    return (
        <div className={styles.grid}>
            {isAdmin && <CreateCard onClick={onAction} />}
            {isMember && <BrowseCard onClick={onAction} societies={allSocieties} />}
            {items.map(s => <SocietyCard key={s.id} society={s} onClick={() => onSelect?.(s)} onReport={onReport} onUnreport={onUnreport} />)}
        </div>
    );
}
