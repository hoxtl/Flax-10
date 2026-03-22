/**
 * Homepage photo widget.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "../styles/PhotoWidget.module.css";

const PHOTO_KEY = "homepage_photo_src";
const CAPTION_KEY = "homepage_photo_caption";

export default function PhotoWidget({ editMode = false }) {
  const fileRef = useRef();
  const state = usePhotoState();
  return <PhotoWidgetBody editMode={editMode} fileRef={fileRef} {...state} />;
}

function usePhotoState() {
  const [src, setSrc] = useState(() => localStorage.getItem(PHOTO_KEY) || "");
  const [caption, setCaption] = useState(() => localStorage.getItem(CAPTION_KEY) || "");
  const [editingCaption, setEditingCaption] = useState(false);
  useStorageEffect(CAPTION_KEY, caption);
  useStorageEffect(PHOTO_KEY, src);
  return { caption, editingCaption, setCaption, setEditingCaption, setSrc, src };
}

function useStorageEffect(storageKey, value) {
  useEffect(() => syncStoredValue(storageKey, value), [storageKey, value]);
}

function syncStoredValue(storageKey, value) {
  if (value) localStorage.setItem(storageKey, value);
  else localStorage.removeItem(storageKey);
}

function PhotoWidgetBody(props) {
  return <div className={`${styles.root} ${!props.src && props.editMode ? styles.clickable : ""}`} onClick={() => openEmptyUploader(props.fileRef, props.src, props.editMode)}>{!props.src && <PhotoHeader />}{getPhotoInput(props)}{props.src ? <PhotoContent {...props} /> : <EmptyPhotoState editMode={props.editMode} fileRef={props.fileRef} />}</div>;
}

function openEmptyUploader(fileRef, src, editMode) {
  if (!src && editMode) fileRef.current?.click();
}

function PhotoHeader() {
  return <div className={baseStyles.widgetHeader} style={headerStyle}><div className={baseStyles.headerIconWrap}><ImageIcon size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden /></div><span className={baseStyles.headerTitle}>Photos</span></div>;
}

const headerStyle = { position: "absolute", top: 16, left: 16, zIndex: 5 };

function getPhotoInput(props) {
  return <input ref={props.fileRef} type="file" accept="image/*" onChange={(event) => handleFileChange(event, props.setSrc)} className={styles.fileInput} />;
}

function handleFileChange(event, setSrc) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (loadEvent) => setSrc(loadEvent.target?.result || "");
  reader.readAsDataURL(file);
  event.target.value = "";
}

function PhotoContent(props) {
  return <><img src={props.src} alt="Your photo" className={styles.photo} /><PhotoCaption {...props} /><EditControls {...props} /></>;
}

function PhotoCaption({ caption, editMode, editingCaption, setCaption, setEditingCaption }) {
  if (editingCaption) return <CaptionEditor caption={caption} setCaption={setCaption} setEditingCaption={setEditingCaption} />;
  if (!caption) return null;
  return <div className={styles.captionOverlay}><span className={styles.captionText} onClick={(event) => startCaptionEdit(event, editMode, setEditingCaption)} title={editMode ? "Click to edit caption" : undefined}>{caption}</span></div>;
}

function startCaptionEdit(event, editMode, setEditingCaption) {
  if (!editMode) return;
  event.stopPropagation();
  setEditingCaption(true);
}

function CaptionEditor({ caption, setCaption, setEditingCaption }) {
  return <div className={styles.captionEditor} onClick={(event) => event.stopPropagation()}><input autoFocus className={styles.captionInput} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Add a caption…" onBlur={() => setEditingCaption(false)} onKeyDown={(event) => event.key === "Enter" && setEditingCaption(false)} /></div>;
}

function EditControls({ caption, editMode, editingCaption, fileRef, setCaption, setEditingCaption, setSrc }) {
  if (!editMode) return null;
  return <div className={styles.editControls} onClick={(event) => event.stopPropagation()}><button className={styles.changeBtn} onClick={() => fileRef.current?.click()}>✎ Change</button>{!caption && !editingCaption && <button className={styles.captionBtn} onClick={() => setEditingCaption(true)}>+ Caption</button>}<button className={styles.removeBtn} onClick={() => clearPhoto(setSrc, setCaption)}>Remove</button></div>;
}

function clearPhoto(setSrc, setCaption) {
  setSrc("");
  setCaption("");
}

function EmptyPhotoState({ editMode, fileRef }) {
  return <div className={styles.empty}><div className={styles.emptyIcon}><ImageIcon size={28} strokeWidth={1.25} aria-hidden /></div><p className={styles.emptyTitle}>{editMode ? "Add a photo" : "No photo yet"}</p>{editMode && <UploadPrompt fileRef={fileRef} />}</div>;
}

function UploadPrompt({ fileRef }) {
  return <><p className={styles.emptySub}>Upload from your device</p><button className={styles.uploadBtn} onClick={(event) => openUpload(event, fileRef)}><Upload size={13} strokeWidth={2} aria-hidden />Upload photo</button></>;
}

function openUpload(event, fileRef) {
  event.stopPropagation();
  fileRef.current?.click();
}
