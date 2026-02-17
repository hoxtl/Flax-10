import { useState } from 'react';
import styles from './TimetableImportModal.module.css';

async function tryImport(url, onImport) {
  try { await onImport(url.trim()); return null; }
  catch (err) { return err.message || 'Import failed'; }
}

function useImportForm(onImport, onClose) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return setError('Please enter a URL');
    setLoading(true);
    const err = await tryImport(url, onImport);
    if (err) { setError(err); setLoading(false); return; }
    setUrl('');
    onClose();
    setLoading(false);
  };
  return { url, setUrl, loading, error, handleSubmit };
}

function ModalHeader({ onClose }) {
  return (
    <div className={styles.header}>
      <h2>Import Timetable</h2>
      <button className={styles.closeBtn} onClick={onClose}>✕</button>
    </div>
  );
}

function ModalForm({ url, setUrl, loading, error, onClose, handleSubmit }) {
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.instructions}>Paste your timetable URL (.ics file or timetable page link)</p>
      <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/timetable.ics" className={styles.input} required autoFocus />
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>Cancel</button>
        <button type="submit" className={styles.importBtn} disabled={loading}>{loading ? 'Importing...' : 'Import'}</button>
      </div>
    </form>
  );
}

export default function TimetableImportModal({ isOpen, onClose, onImport }) {
  const form = useImportForm(onImport, onClose);
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <ModalHeader onClose={onClose} />
        <ModalForm {...form} onClose={onClose} />
      </div>
    </div>
  );
}