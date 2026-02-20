import { useState } from "react";

function useSettingsModal(props) {
    const { members, onFetchMembers, onUpdateRole, onAddCollaborator } = props;
    const [showAddModal, setShowAddModal] = useState(false);
    useEffect(() => { onFetchMembers?.(); }, [onFetchMembers]);
    const handleAddCollaborators = async (users) => {
      for (const user of users) await addOrPromoteCollaborator(user, members, onUpdateRole, onAddCollaborator);
      onFetchMembers?.();
    };
    const collaborators = (members || []).filter(m => m.role !== 'member');
    const collaboratorUsernames = collaborators.map(c => c.username);
    return { showAddModal, setShowAddModal, handleAddCollaborators, collaborators, collaboratorUsernames };}
  
  export default function SettingsModal(props) {
    const { onClose, onDelete, onUpdateRole, onRemoveMember, ratificationStatus, isRatified, onRequestRatification } = props;
    const { showAddModal, setShowAddModal, handleAddCollaborators, collaborators, collaboratorUsernames } = useSettingsModal(props);
    return (
      <>
        <div className={styles.backdrop} onMouseDown={onClose}>
          <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader onClose={onClose} />
            <RatificationSection status={ratificationStatus} isRatified={isRatified} onRequest={onRequestRatification} />
            <AddCollaboratorSection onOpenModal={() => setShowAddModal(true)} />
            <CollaboratorsSection collaborators={collaborators} onUpdateRole={onUpdateRole} onRemove={onRemoveMember} />
            <DangerSection onDelete={onDelete} onClose={onClose} />
          </div>
        </div>
        {showAddModal && <AddCollaboratorModal onClose={() => setShowAddModal(false)} onAdd={handleAddCollaborators} existingUsernames={collaboratorUsernames} />}
      </>);}