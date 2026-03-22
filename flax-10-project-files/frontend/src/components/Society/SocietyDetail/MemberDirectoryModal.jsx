/**
 * MemberDirectoryModal displays a searchable list of all society members.
 * Admins can remove members from the directory.
 */
import { useState, useEffect, useMemo } from "react";
import GenericSummaryModal from "../../Common/GenericSummaryModal/GenericSummaryModal";
import SummaryItem from "../../Common/GenericSummaryModal/SummaryItem";
import SearchBar from "../../Common/SearchBar/SearchBar";
import UserAvatar from "../../Common/UserAvatar/UserAvatar";
import { useConfirm } from "../../../context/ConfirmContext";
import { X } from "lucide-react";
import { useSearchFilter } from "../../../hooks/useSearchFilter";

function RoleBadge({ role }) {
    const style = { backgroundColor: 'var(--primary-light, #fef3c7)', color: 'var(--primary, #d97706)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600' };
    return <span style={style}>{role}</span>;
}

function MemberTitle({ member }) {
    const isAdmin = member.role === 'admin' || member.role === 'editor';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {member.username}
            {isAdmin && <RoleBadge role={member.role} />}
        </div>
    );
}

function RemoveButton({ member, onRemove }) {
    const style = { background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' };
    return <button style={style} onClick={(e) => onRemove(member, e)} aria-label="Remove member"><X size={18} /></button>;
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
