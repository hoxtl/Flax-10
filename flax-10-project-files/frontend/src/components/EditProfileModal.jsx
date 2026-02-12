import { useState } from "react";
import styles from "./EditProfileModal.module.css";
import { getInitials } from "../utils/userUtils";

function ModalHeader({ onClose }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>Edit Profile</h2>
      <button className={styles.closeBtn} onClick={onClose}>✕</button>
    </div>
  );
}

function ProfilePictureSection({ user }) {
  const initials = getInitials(user?.name) || "?";

  const handleChangePhoto = () => {
    console.log("Change photo clicked");
    // TODO: Implement photo upload
  };

  return (
    <div className={styles.section}>
      <div className={styles.photoSection}>
        <div className={styles.currentPhoto}>{initials}</div>
        <div>
          <div className={styles.userName}>{user?.name || "Guest"}</div>
          <button className={styles.linkBtn} onClick={handleChangePhoto}>
            Change profile photo
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, type = "text" }) {
  return (
    <div className={styles.formField}>
      <label className={styles.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
    </div>
  );
}

function BioField({ value, onChange }) {
  return (
    <div className={styles.formField}>
      <label className={styles.label}>Bio</label>
      <textarea
        name="bio"
        value={value}
        onChange={onChange}
        className={styles.textarea}
        rows={3}
        placeholder="Year 2 · CS"
      />
    </div>
  );
}

function SaveButton({ onClick, isSaving }) {
  return (
    <div className={styles.footer}>
      <button className={styles.saveBtn} onClick={onClick} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export default function EditProfileModal({ user, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    bio: `${user?.year || "Year 2"} · ${user?.major || "CS"}`,
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <ModalHeader onClose={onClose} />
        
        <div className={styles.content}>
          <ProfilePictureSection user={user} />
          
          <FormField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />

          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />

          <BioField
            value={formData.bio}
            onChange={handleChange}
          />
        </div>

        <SaveButton onClick={handleSave} isSaving={isSaving} />
      </div>
    </div>
  );
}