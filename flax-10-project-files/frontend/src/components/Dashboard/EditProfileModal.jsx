import { useState } from 'react';
import styles from './EditProfileModal.module.css';
import { updateUserProfile } from '../../api/userService';
import { getInitials } from '../Authentication/utils/userUtils';
import StandardModal from '../common/StandardModal/StandardModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function useProfileForm(user) {
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_photo_url || null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  return { username, setUsername, bio, setBio, profilePhoto, setProfilePhoto, previewUrl, setPreviewUrl, removePhoto, setRemovePhoto, loading, setLoading, error, setError, success, setSuccess };
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

async function submitProfileUpdate(formData, onSave, setError, setSuccess, onClose) {
  try {
    await updateUserProfile(formData);
    await onSave();
    setSuccess('Profile saved successfully!');
    setTimeout(onClose, 1500);
  } catch (err) {
    console.error('Failed to update profile:', err);
    setError(err.response?.data?.error || 'Failed to update profile');
  }
}

function buildSubmitHandler(form, user, onSave, onClose) {
  const { username, bio, profilePhoto, removePhoto, setLoading, setError, setSuccess } = form;
  return async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters long'); setLoading(false); return; }
    const isAvailable = await checkUsernameAvailable(username, user?.username);
    if (!isAvailable) { setError('Username is already taken'); setLoading(false); return; }
    await submitProfileUpdate(buildFormData(username, bio, profilePhoto, removePhoto), onSave, setError, setSuccess, onClose);
    setLoading(false);
  };
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
        <button type="button" className={styles.photoRemove} onClick={onRemove}>Remove Photo</button>
      )}
    </div>
  );
}

function PhotoSection({ previewUrl, initials, user, onPhotoChange, onRemovePhoto }) {
  return (
    <div className={styles.photoSection}>
      <div className={styles.photoPreview}>
        <PhotoPreview previewUrl={previewUrl} initials={initials} />
      </div>
      <PhotoActions previewUrl={previewUrl} profilePhotoUrl={user?.profile_photo_url} onChange={onPhotoChange} onRemove={onRemovePhoto} />
    </div>
  );
}

function UsernameField({ username, setUsername }) {
  return (
    <div className={styles.field}>
      <label>Username</label>
      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} placeholder="Choose a username" />
    </div>
  );
}

function BioField({ bio, setBio }) {
  return (
    <div className={styles.field}>
      <label>Reminder Note</label>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Add a personal reminder note..." />
    </div>
  );
}

function FormActions({ loading, onClose }) {
  return (
    <div className={styles.actions}>
      <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
      <button type="submit" disabled={loading} className={styles.saveBtn}>{loading ? 'Saving...' : 'Save Changes'}</button>
    </div>
  );
}

function ModalForm({ form, user, onClose, onSubmit }) {
  const { username, setUsername, bio, setBio, previewUrl, setProfilePhoto, setPreviewUrl, setRemovePhoto, loading, error, success } = form;
  const initials = user?.name ? getInitials(user.name) : username.substring(0, 2).toUpperCase();
  const onPhotoChange = (e) => handlePhotoChange(e, setProfilePhoto, setPreviewUrl, setRemovePhoto);
  const onRemovePhoto = () => handleRemovePhoto(setProfilePhoto, setPreviewUrl, setRemovePhoto);
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      {success && <div className={styles.success}>{success}</div>}
      {error && <div className={styles.error}>{error}</div>}
      <PhotoSection previewUrl={previewUrl} initials={initials} user={user} onPhotoChange={onPhotoChange} onRemovePhoto={onRemovePhoto} />
      <UsernameField username={username} setUsername={setUsername} />
      <BioField bio={bio} setBio={setBio} />
      <FormActions loading={loading} onClose={onClose} />
    </form>);}

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
  const form = useProfileForm(user);
  if (!isOpen) return null;
  const handleSubmit = buildSubmitHandler(form, user, onSave, onClose);
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
