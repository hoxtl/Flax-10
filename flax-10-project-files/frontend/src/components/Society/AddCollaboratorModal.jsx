import { useState, useEffect } from "react";
import { searchUsers } from "../../api/societyApi";
import styles from "./AddCollaboratorModal.module.css";

const ROLES = [
    { value: "editor", label: "Editor" },
    { value: "admin", label: "Admin" }
];

export default function AddCollaboratorModal({ onClose, onAdd, existingUsernames = [] }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState([]);
    const [role, setRole] = useState("editor");

    useEffect(() => { fetchResults(query, setResults); }, [query]);

    const handleSelect = (user) => {
        if (!selected.find(u => u.id === user.id)) setSelected([...selected, user]);
        setQuery("");
        setResults([]);
    };

    const handleRemove = (userId) => setSelected(selected.filter(u => u.id !== userId));
    const handleAdd = () => { onAdd(selected, role); onClose(); };
    const filteredResults = results.filter(u => !existingUsernames.includes(u.username));

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <ModalHeader onClose={onClose} />
                <SearchInput query={query} setQuery={setQuery} />
                {filteredResults.length > 0 && <SearchResults results={filteredResults} onSelect={handleSelect} />}
                <SelectedUsers users={selected} onRemove={handleRemove} />
                <RoleSelect role={role} setRole={setRole} />
                <ModalFooter onClose={onClose} onAdd={handleAdd} disabled={selected.length === 0} />
            </div>
        </div>
    );
}

async function fetchResults(query, setResults) {
    if (query.length < 2) return setResults([]);
    try {
        const data = await searchUsers(query);
        setResults(data);
    } catch { setResults([]); }
}

function ModalHeader({ onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>Add Collaborators</h3>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
    );
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

function RoleSelect({ role, setRole }) {
    return (
        <div className={styles.roleRow}>
            <label className={styles.roleLabel}>Role:</label>
            <select className={styles.roleSelect} value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
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
