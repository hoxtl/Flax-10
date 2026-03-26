/**
 * SocietySection renders a categorized group of society cards (e.g., "My Memberships"),
 * potentially including a specific "Browse" or "Create" action card.
 */

import styles from "./SocietiesPage.module.css";
import gridStyles from "../../components/common/Card/CardGrid.module.css";
<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Societies/SocietySection.jsx
import SocietyCard from "../../components/Society/SocietyCard";
import BrowseCard from "../../components/Society/BrowseCard";
import CreateCard from "../../components/Society/CreateCard";
import { Pagination } from "../../components/Pagination/Pagination";
=======
import SocietyCard from "../../components/society/SocietyCard";
import BrowseCard from "../../components/society/BrowseCard";
import CreateCard from "../../components/society/CreateCard";
import { Pagination } from "../../components/pagination/Pagination";
>>>>>>> origin/main:flax-10-project-files/frontend/src/pages/societies/SocietySection.jsx

/** Displays a titled collection of societies with optional pagination. */

export default function SocietySection({ title, items, type, onAction, allSocieties = [], onSelect, onReport, onUnreport, hideTitle, pagination }) {
    return (
        <section className={styles.section}>
            {!hideTitle && <SectionHeader title={title} type={type} onAction={onAction} />}
            {pagination && <Pagination {...pagination} />}
            <SectionGrid items={items} type={type} onAction={onAction}
                allSocieties={allSocieties} onSelect={onSelect}
                onReport={onReport} onUnreport={onUnreport} />
            {pagination && <Pagination {...pagination} />}
        </section>
    );
}

/** Renders the section title and an optional (+) action button. */

function SectionHeader({ title, type, onAction }) {
    return (
        <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>{title}</h3>
            {type === "admin" &&
                <button className={styles.miniAddBtn} onClick={onAction}>+</button>
            }
        </div>
    );
}

/** Renders the grid of societies along with type-specific action cards. */

function SectionGrid({ items, type, onAction, allSocieties, onSelect, onReport, onUnreport }) {
    return (
        <div className={gridStyles.grid}>
            {type === "admin" && <CreateCard onClick={onAction} />}
            {type === "member" && <BrowseCard onClick={onAction} societies={allSocieties} />}
            {items.map(s => (
                <SocietyCard key={s.id} society={s} onClick={onSelect}
                    onReport={onReport} onUnreport={onUnreport} />
            ))}
        </div>
    );
}
