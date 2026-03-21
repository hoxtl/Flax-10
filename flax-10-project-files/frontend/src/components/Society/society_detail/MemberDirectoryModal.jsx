/**
 * MemberDirectoryModal displays a searchable list of all society members.
 * Admins can remove members from the directory.
 */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Society/society_detail/MemberDirectoryModal.jsx

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Society/SocietyDetail/MemberDirectoryModal.jsx
import { useState, useEffect, useMemo } from "react";
import GenericSummaryModal from "../../common/generic_summary_modal/GenericSummaryModal";
import SummaryItem from "../../common/generic_summary_modal/SummaryItem";
import SearchBar from "../../common/search_bar/SearchBar";
import UserAvatar from "../../common/user_avatar/UserAvatar";
import { useConfirm } from "../../../context/ConfirmContext";
import { X } from "lucide-react";
import { useSearchFilter } from "../../../hooks/useSearchFilter";
import styles from "./MemberDirectoryModal.module.css";

function RoleBadge({ role }) {
    return <span className={styles.roleBadge}>{role}</span>;
}

function MemberTitle({ member }) {
    const isAdmin = member.role === 'admin' || member.role === 'editor';
    return (
        <div className={styles.memberTitleRow}>
            {member.username}
            {isAdmin && <RoleBadge role={member.role} />}
        </div>
    );
}

function RemoveButton({ member, onRemove }) {
    return <button className={styles.removeBtn} onClick={(e) => onRemove(member, e)} aria-label="Remove member"><X size={18} /></button>;
}

function useMemberDirectory(members, onFetchMembers, searchQuery) {
    const [hasLoaded, setHasLoaded] = useState(Boolean(members?.length) || !onFetchMembers);
    useEffect(() => {
        if (!onFetchMembers) return;
        let active = true;
        onFetchMembers().finally(() => {
            if (active) setHasLoaded(true);
        });
        return () => { active = false; };
    }, [onFetchMembers]);
    const baseFiltered = useSearchFilter(members || [], searchQuery, ['username', 'name']);
    const displayMembers = useMemo(() => sortByRole(baseFiltered), [baseFiltered]);
    return { loading: !hasLoaded && !members?.length, displayMembers };
}

function sortByRole(members) {
    const admins = members.filter(m => m.role === 'admin' || m.role === 'editor');
    const regular = members.filter(m => m.role === 'member');
    return [...admins, ...regular];
}

const ListItems = ({ members, isAdmin, onRemove }) => (
    members.map(m => (
        <SummaryItem key={m.user} avatar={<UserAvatar user={m} avatarOnly />} title={<MemberTitle member={m} />}
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: `profile_${m.user}` }))}
            rightAction={isAdmin ? <RemoveButton member={m} onRemove={onRemove} /> : null} />
    ))
);

export default function MemberDirectoryModal({ societyName, members, onFetchMembers, onRemoveMember, isAdmin, onClose }) {
    const [searchQuery, setSearchQuery] = useState("");
    const confirm = useConfirm();
    const { loading, displayMembers } = useMemberDirectory(members, onFetchMembers, searchQuery);

    const handleRemove = async (member, e) => {
        e.stopPropagation();
        const conf = await confirm({ title: "Remove Member", message: `Are you sure you want to remove ${member.username} from ${societyName}?`, confirmText: "Remove", cancelText: "Cancel", confirmStyle: "danger" });
        if (conf) onRemoveMember?.(member.user);
    };

    return (
        <GenericSummaryModal isOpen={true} onClose={onClose} title={`Members of ${societyName}`} subtitle="View everyone in this society"
            emptyMessage={loading ? "Loading members..." : "No members found."}
            topContent={<SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search members..." />}
            items={displayMembers}>
            <ListItems members={displayMembers} isAdmin={isAdmin} onRemove={handleRemove} />
        </GenericSummaryModal>
    );
}
