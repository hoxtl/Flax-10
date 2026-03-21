/*
 * useSocietyMembers manages member and collaborator operations for a society.
 */
import { useState } from 'react';
import * as api from '../../../api/societyApi';

const adjustMemberCount = (setSociety, delta) =>
    setSociety(prev => ({
        ...prev,
        member_count: Math.max(0, (prev.member_count || 0) + delta)
    }));

const makeFetchMembers = (id, setMembers) =>
    async () => {
        const data = await api.fetchMembers(id);
        setMembers(data);
    };

const makeUpdateMemberRole = (id, setMembers) =>
    async (userId, role) => {
        await api.updateMemberRole(id, userId, role);
        setMembers(prev => prev.map(m => m.user === userId ? { ...m, role } : m));
    };

const makeAddCollaborator = (id, setSociety, setMembers) =>
    async (userId, role) => {
        const member = await api.addCollaborator(id, userId, role);
        adjustMemberCount(setSociety, 1);
        setMembers(prev => [...prev, member]);
        return member;
    };

const makeRemoveMember = (id, setSociety, setMembers) =>
    async (userId) => {
        await api.leaveSociety(id, userId);
        adjustMemberCount(setSociety, -1);
        setMembers(prev => prev.filter(m => m.user !== userId));
    };

export const useSocietyMembers = (id, setSociety) => {
    const [members, setMembers] = useState([]);
    return {
        members,
        fetchMembers: makeFetchMembers(id, setMembers),
        updateMemberRole: makeUpdateMemberRole(id, setMembers),
        addCollaborator: makeAddCollaborator(id, setSociety, setMembers),
        removeMember: makeRemoveMember(id, setSociety, setMembers),
    };
};
