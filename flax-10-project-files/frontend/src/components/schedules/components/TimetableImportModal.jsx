import { useState } from 'react';
import StandardModal from '../../common/standard_modal/StandardModal';
import FormField from '../../common/form_field/FormField';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import TextInput from '../../common/text_input/TextInput';
import styles from '../styles/TimetableImportModal.module.css';

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
    setLoading(false);};
  return { url, setUrl, loading, error, handleSubmit };}

function ModalForm({ url, setUrl, loading, error, onClose, handleSubmit }) {
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.instructions}>Paste your timetable URL (.ics file or timetable page link)</p>
      <FormField label="Timetable URL" error={error}>
        <TextInput type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/timetable.ics" className={styles.input} required autoFocus />
      </FormField>
      <div className={styles.actions}>
        <PrimaryButton type="button" onClick={onClose} className={styles.cancelBtn} variant="ghost" pill disabled={loading}>Cancel</PrimaryButton>
        <PrimaryButton type="submit" className={styles.importBtn} pill disabled={loading}>{loading ? 'Importing...' : 'Import'}</PrimaryButton>
      </div>
    </form>
  );
}

export default function TimetableImportModal({ isOpen, onClose, onImport }) {
  const form = useImportForm(onImport, onClose);
  if (!isOpen) return null;
  return (
      <StandardModal
        title="Import Timetable"
        subtitle="Paste your timetable URL (.ics file or timetable page link)"
        onClose={onClose}
        size="sm"
        modalClassName={styles.modalShell}
        contentClassName={styles.modalContent}
      >
        <ModalForm {...form} onClose={onClose} />
      </StandardModal>
  );
}
