import { useState, useEffect } from "react";
import { searchUsers } from "../../api/userService";
import StandardModal from "../common/StandardModal/StandardModal";
import styles from "./AddCollaboratorModal.module.css";

export default function AddCollaboratorModal({ onClose, onAdd, existingUsernames = [] }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState([]);

    useEffect(() => { fetchResults(query, setResults); }, [query]);

    const handleSelect = (user) => {
        if (!selected.find(u => u.id === user.id)) setSelected([...selected, user]);
        setQuery("");
        setResults([]);
    };

    const handleRemove = (userId) => setSelected(selected.filter(u => u.id !== userId));
    const handleAdd = () => { onAdd(selected); onClose(); };
    const filteredResults = filterResults(results, selected, existingUsernames);

    return (
        <StandardModal
            title="Add Collaborators"
            onClose={onClose}
            size="sm"
            modalClassName={styles.modalShell}
            contentClassName={styles.modalContent}
        >
            <SearchInput query={query} setQuery={setQuery} />
            {filteredResults.length > 0 && <SearchResults results={filteredResults} onSelect={handleSelect} />}
            <SelectedUsers users={selected} onRemove={handleRemove} />
            <ModalFooter onClose={onClose} onAdd={handleAdd} disabled={selected.length === 0} />
        </StandardModal>
    );
}

function filterResults(results, selected, existingUsernames) {
    if (!Array.isArray(results)) return [];
    const selectedIds = new Set(selected.map(u => u.id));
    return results.filter(u => !existingUsernames.includes(u.username) && !selectedIds.has(u.id));
}

async function fetchResults(query, setResults) {
    if (query.length < 2) return setResults([]);
    try {
        const data = await searchUsers(query);
        setResults(data?.results || data || []);
    } catch { setResults([]); }
}

function SearchInput({ query, setQuery }) {
    return (
        <input className={styles.input} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by username..." autoFocus />
    );
}

function SearchResults({ results, onSelect }) {
    return (
        <div className={styles.results}>
            {results.map(user => (
                <button key={user.id} className={styles.resultItem} onClick={() => onSelect(user)}>
                    {user.username}
                </button>
            ))}
        </div>
    );
}

function SelectedUsers({ users, onRemove }) {
    if (users.length === 0) return null;
    return (
        <div className={styles.selected}>
            {users.map(user => (
                <span key={user.id} className={styles.chip}>
                    {user.username}
                    <button className={styles.chipRemove} onClick={() => onRemove(user.id)}>&times;</button>
                </span>
            ))}
        </div>
    );
}

function ModalFooter({ onClose, onAdd, disabled }) {
    return (
        <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.addBtn} onClick={onAdd} disabled={disabled}>Add</button>
        </div>
    );
}
