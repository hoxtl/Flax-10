/*
 * CollaboratorList renders selected collaborators and role controls.
 */
<<<<<<< HEAD

import styles from "./CollaboratorList.module.css";
import AnimatedDropdown from "../common/animated_dropdown";
=======
import styles from "./CollaboratorList.module.css";
import AnimatedDropdown from "../common/AnimatedDropdown";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const ROLES = [
    { value: "editor", label: "Editor" },
    { value: "admin", label: "Admin" }
];

export default function CollaboratorList({ collaborators, onRoleChange, onRemove, emptyMessage = "No collaborators yet." }) {
    if (!collaborators || collaborators.length === 0) {
        return <p className={styles.empty}>{emptyMessage}</p>;
    }
    return (
        <div className={styles.list}>
            {collaborators.map(c => (
                <CollaboratorRow key={c.id || c.user} collaborator={c} onRoleChange={onRoleChange} onRemove={onRemove} />
            ))}
        </div>
    );
}

function CollaboratorRow({ collaborator, onRoleChange, onRemove }) {
    const id = collaborator.user || collaborator.id;
    return (
        <div className={styles.row}>
            <span className={styles.name}>{collaborator.username}</span>
            <RoleSelect value={collaborator.role} onChange={(role) => onRoleChange?.(id, role)} />
            <button className={styles.removeBtn} onClick={() => onRemove?.(id)} title="Remove">&times;</button>
        </div>
    );
}

function RoleSelect({ value, onChange }) {
    return (
        <div className={styles.roleDropdown}>
            <AnimatedDropdown value={value} onChange={onChange} options={ROLES} placeholder="Role" />
        </div>
    );
}
