import { useState } from 'react';
import * as api from '../../../api/societyApi';

export const useSocietyMembers = (id, setSociety) => {
    const [members, setMembers] = useState([]);

    const fetchMembers = async () => {
        const data = await api.fetchMembers(id);
        setMembers(data);
    };

    const updateMemberRole = async (userId, role) => {
        await api.updateMemberRole(id, userId, role);
        setMembers(prev => prev.map(m => m.user === userId ? { ...m, role } : m));
    };

    const addCollaborator = async (userId, role) => {
        const member = await api.addCollaborator(id, userId, role);
        setSociety(prev => ({ ...prev, member_count: (prev.member_count || 0) + 1 }));
        setMembers(prev => [...prev, member]);
        return member;
    };

    const removeMember = async (userId) => {
        await api.leaveSociety(id, userId);
        setSociety(prev => ({ ...prev, member_count: Math.max(0, (prev.member_count || 0) - 1) }));
        setMembers(prev => prev.filter(m => m.user !== userId));
    };

    return { members, fetchMembers, updateMemberRole, addCollaborator, removeMember };
};
