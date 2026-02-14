import { useState } from 'react';
import styles from './EditProfileModal.module.css';
import { updateUserProfile } from '../api/userService';
import { getInitials } from '../utils/userUtils';

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profile_photo_url || null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
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
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(`${firstName} ${lastName}`);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Profile</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
            <label>First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
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
