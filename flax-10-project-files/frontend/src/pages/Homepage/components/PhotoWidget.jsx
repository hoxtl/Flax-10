/**
 * PhotoWidget
 * A personalisation widget — lets users upload a photo from their device.
 * The image (base64) and caption are persisted in localStorage.
 * In edit mode: shows upload CTA + change button over existing photo.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { ImageIcon, Upload } from "lucide-react";
import styles from "../styles/PhotoWidget.module.css";

const PHOTO_KEY   = "homepage_photo_src";
const CAPTION_KEY = "homepage_photo_caption";

export default function PhotoWidget({ editMode = false }) {
  const fileRef = useRef();

  const [src, setSrc] = useState(() => localStorage.getItem(PHOTO_KEY) || "");
  const [caption, setCaption] = useState(() => localStorage.getItem(CAPTION_KEY) || "");
  const [editingCaption, setEditingCaption] = useState(false);

  // Persist whenever they change
  useEffect(() => {
    if (src)     localStorage.setItem(PHOTO_KEY, src);
    else         localStorage.removeItem(PHOTO_KEY);
  }, [src]);

  useEffect(() => {
    if (caption) localStorage.setItem(CAPTION_KEY, caption);
    else         localStorage.removeItem(CAPTION_KEY);
  }, [caption]);

  const handleFile = useCallback(e => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setSrc(ev.target.result);
    reader.readAsDataURL(f);
    e.target.value = ""; // allow re-selecting same file
  }, []);

  const clearPhoto = useCallback(() => {
    setSrc("");
    setCaption("");
  }, []);

  return (
    <div
      className={`${styles.root} ${!src && editMode ? styles.clickable : ""}`}
      onClick={() => { if (!src && editMode) fileRef.current?.click(); }}
    >
      {/* hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className={styles.fileInput}
      />

      {src ? (
        <>
          <img src={src} alt="Your photo" className={styles.photo} />

          {/* Caption overlay */}
          {caption && !editingCaption && (
            <div className={styles.captionOverlay}>
              <span
                className={styles.captionText}
                onClick={e => { if (editMode) { e.stopPropagation(); setEditingCaption(true); } }}
                title={editMode ? "Click to edit caption" : undefined}
              >
                {caption}
              </span>
            </div>
          )}

          {/* Caption inline editor */}
          {editingCaption && (
            <div className={styles.captionEditor} onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                className={styles.captionInput}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption…"
                onBlur={() => setEditingCaption(false)}
                onKeyDown={e => e.key === "Enter" && setEditingCaption(false)}
              />
            </div>
          )}

          {/* Edit-mode controls */}
          {editMode && (
            <div className={styles.editControls} onClick={e => e.stopPropagation()}>
              <button
                className={styles.changeBtn}
                onClick={() => fileRef.current?.click()}
              >
                ✎ Change
              </button>
              {!caption && !editingCaption && (
                <button
                  className={styles.captionBtn}
                  onClick={() => setEditingCaption(true)}
                >
                  + Caption
                </button>
              )}
              <button className={styles.removeBtn} onClick={clearPhoto}>
                Remove
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty state */
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <ImageIcon size={28} strokeWidth={1.25} aria-hidden />
          </div>
          <p className={styles.emptyTitle}>
            {editMode ? "Add a photo" : "No photo yet"}
          </p>
          {editMode && (
            <>
              <p className={styles.emptySub}>Upload from your device</p>
              <button
                className={styles.uploadBtn}
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
              >
                <Upload size={13} strokeWidth={2} aria-hidden />
                Upload photo
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
