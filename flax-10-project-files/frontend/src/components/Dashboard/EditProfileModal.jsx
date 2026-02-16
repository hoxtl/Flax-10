import { useState } from 'react';
import styles from './EditProfileModal.module.css';
import { updateUserProfile } from '../../api/userService';
import { getInitials } from '../Authentication/utils/userUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_photo_url || null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemovePhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPreviewUrl(null);
    setRemovePhoto(true);
  };

  const checkUsernameAvailable = async (newUsername) => {
    // If username hasn't changed, it's valid
    if (newUsername === user?.username) {
      return true;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/check-username/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ username: newUsername })
      });

      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    // Check if username is available
    const isAvailable = await checkUsernameAvailable(username);
    if (!isAvailable) {
      setError('Username is already taken');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);

      if (profilePhoto) {
        formData.append('profile_photo', profilePhoto);
      } else if (removePhoto) {
        formData.append('remove_photo', 'true');
      }

      await updateUserProfile(formData);
      await onSave();
      window.location.reload();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name ? getInitials(user.name) : username.substring(0, 2).toUpperCase();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Profile</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <div className={styles.photoSection}>
            <div className={styles.photoPreview}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {initials}
                </div>
              )}
            </div>
            <div className={styles.photoActions}>
              <label className={styles.photoUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                Change Photo
              </label>
              {(previewUrl || user?.profile_photo_url) && (
                <button
                  type="button"
                  className={styles.photoRemove}
                  onClick={handleRemovePhoto}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="Choose a username"
            />
          </div>

          <div className={styles.field}>
            <label>Reminder Note</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Add a personal reminder note..."
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.saveBtn}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
