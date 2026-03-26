import styles from './EditProfileModal.module.css';
import { getInitials } from '../Auth/utils/userUtils';
import FormField from '../common/form_field/FormField';
import PrimaryButton from '../common/primary_button/PrimaryButton';
import StandardModal from '../common/standard_modal/StandardModal';
import TextInput from '../common/text_input/TextInput';
import { useTransientSavedState } from '../common/hooks/useTransientSavedState';
import { buildEditProfileSubmitHandler, useEditProfileForm } from './useEditProfileForm';

function handlePhotoChange(e, setProfilePhoto, setPreviewUrl, setRemovePhoto) {
  const file = e.target.files[0];
  if (!file) return;
  setProfilePhoto(file);
  setPreviewUrl(URL.createObjectURL(file));
  setRemovePhoto(false);
}

function handleRemovePhoto(setProfilePhoto, setPreviewUrl, setRemovePhoto) {
  setProfilePhoto(null);
  setPreviewUrl(null);
  setRemovePhoto(true);
}

function PhotoPreview({ previewUrl, initials }) {
  if (previewUrl) return <img src={previewUrl} alt="Preview" />;
  return <div className={styles.photoPlaceholder}>{initials}</div>;
}

function PhotoActions({ previewUrl, profilePhotoUrl, onChange, onRemove }) {
  return (
    <div className={styles.photoActions}>
      <label className={styles.photoUpload}>
        <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
        Change Photo
      </label>
      {(previewUrl || profilePhotoUrl) && (
        <PrimaryButton type="button" className={styles.photoRemove} variant="danger" pill onClick={onRemove}>Remove Photo</PrimaryButton>
      )}
    </div>
  );
}

function PhotoSection({ previewUrl, initials, canRemovePhoto, onPhotoChange, onRemovePhoto }) {
  return (
    <div className={styles.photoSection}>
      <div className={styles.photoPreview}>
        <PhotoPreview previewUrl={previewUrl} initials={initials} />
      </div>
      <PhotoActions previewUrl={previewUrl} profilePhotoUrl={canRemovePhoto ? previewUrl : null} onChange={onPhotoChange} onRemove={onRemovePhoto} />
    </div>
  );
}

function UsernameField({ username, setUsername }) {
  return (
    <FormField label="Username" htmlFor="edit-profile-username" className={styles.field}>
      <TextInput id="edit-profile-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} placeholder="Choose a username" />
    </FormField>
  );
}

function BioField({ bio, setBio }) {
  return (
    <FormField label="Reminder Note" htmlFor="edit-profile-bio" className={styles.field}>
      <TextInput multiline id="edit-profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Add a personal reminder note..." />
    </FormField>
  );
}

function FormActions({ loading, onClose, saveSignal }) {
  const showSaved = useTransientSavedState(saveSignal);
  const buttonLabel = loading ? 'Saving...' : showSaved ? '✓ Saved!' : 'Save Changes';
  return (
    <div className={styles.actions}>
      <PrimaryButton type="button" onClick={onClose} className={styles.cancelBtn} variant="ghost" pill>Cancel</PrimaryButton>
      <PrimaryButton type="submit" disabled={loading} className={`${styles.saveBtn} ${showSaved ? styles.saveBtnSaved : ''}`} pill>{buttonLabel}</PrimaryButton>
    </div>
  );
}

function ModalForm({ form, user, onClose, onSubmit }) {
  const { username, setUsername, bio, setBio, previewUrl, setProfilePhoto, setPreviewUrl, setRemovePhoto, loading, error, saveSignal } = form;
  const initials = user?.name ? getInitials(user.name) : username.substring(0, 2).toUpperCase();
  const onPhotoChange = (e) => handlePhotoChange(e, setProfilePhoto, setPreviewUrl, setRemovePhoto);
  const onRemovePhoto = () => handleRemovePhoto(setProfilePhoto, setPreviewUrl, setRemovePhoto);
  const canRemovePhoto = Boolean(previewUrl);
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      <PhotoSection previewUrl={previewUrl} initials={initials} canRemovePhoto={canRemovePhoto} onPhotoChange={onPhotoChange} onRemovePhoto={onRemovePhoto} />
      <UsernameField username={username} setUsername={setUsername} />
      <BioField bio={bio} setBio={setBio} />
      <FormActions loading={loading} onClose={onClose} saveSignal={saveSignal} />
    </form>);}

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
  const form = useEditProfileForm(user);
  if (!isOpen) return null;
  const handleSubmit = buildEditProfileSubmitHandler(form, user, onSave, onClose);
  return (
    <StandardModal
      title="Edit Profile"
      onClose={onClose}
      size="md"
      modalClassName={styles.modalShell}
      contentClassName={styles.modalContent}
    >
      <ModalForm form={form} user={user} onClose={onClose} onSubmit={handleSubmit} />
    </StandardModal>
  );
}
