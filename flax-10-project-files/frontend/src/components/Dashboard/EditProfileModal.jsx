import { useEffect, useState } from 'react';
import styles from './EditProfileModal.module.css';
import { updateUserProfile } from '../../api/userService';
import { getInitials } from '../Authentication/utils/userUtils';
import { getResolvedUserPhoto } from '../../utils/tutorPhotoFallback';
import FormField from '../common/FormField/FormField';
import PrimaryButton from '../common/PrimaryButton/PrimaryButton';
import StandardModal from '../common/StandardModal/StandardModal';
import TextInput from '../common/TextInput/TextInput';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function resolveProfilePhoto(user) {
  return getResolvedUserPhoto(user, {
    allowGeneric: false,
    seed: user?.username || user?.id || user?.name,
  });
}

function useProfileForm(user) {
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(resolveProfilePhoto(user));
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSignal, setSaveSignal] = useState(0);
  useEffect(() => {
    setUsername(user?.username || '');
    setBio(user?.bio || '');
    setProfilePhoto(null);
    setPreviewUrl(resolveProfilePhoto(user));
    setRemovePhoto(false);
    setError('');
  }, [user]);
  return { username, setUsername, bio, setBio, profilePhoto, setProfilePhoto, previewUrl, setPreviewUrl, removePhoto, setRemovePhoto, loading, setLoading, error, setError, saveSignal, setSaveSignal };
}

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

async function fetchUsernameAvailable(username, token) {
  const res = await fetch(`${API_BASE_URL}/check-username/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  return data.available;
}

async function checkUsernameAvailable(username, currentUsername) {
  if (username === currentUsername) return true;
  try {
    return await fetchUsernameAvailable(username, localStorage.getItem('token'));
  } catch (err) {
    console.error('Error checking username:', err);
    return false;
  }
}

function buildFormData(username, bio, profilePhoto, removePhoto) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('bio', bio);
  if (profilePhoto) formData.append('profile_photo', profilePhoto);
  else if (removePhoto) formData.append('remove_photo', 'true');
  return formData;
}

async function submitProfileUpdate(formData, onSave, setError, onSaved) {
  try {
    await updateUserProfile(formData);
    await onSave?.();
    onSaved?.();
  } catch (err) {
    console.error('Failed to update profile:', err);
    setError(err.response?.data?.error || 'Failed to update profile');
  }
}

function buildSubmitHandler(form, user, onSave) {
  const { username, bio, profilePhoto, removePhoto, setLoading, setError, setSaveSignal } = form;
  return async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters long'); setLoading(false); return; }
    const isAvailable = await checkUsernameAvailable(username, user?.username);
    if (!isAvailable) { setError('Username is already taken'); setLoading(false); return; }
    await submitProfileUpdate(buildFormData(username, bio, profilePhoto, removePhoto), onSave, setError, () => setSaveSignal((count) => count + 1));
    setLoading(false);
  };
}

function useSavedState(saveSignal) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!saveSignal) return undefined;
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saveSignal]);

  return showSaved;
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
  const showSaved = useSavedState(saveSignal);
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
  const form = useProfileForm(user);
  if (!isOpen) return null;
  const handleSubmit = buildSubmitHandler(form, user, onSave);
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
