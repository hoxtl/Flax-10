import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PasswordReset.module.css';
import PasswordResetPageLayout from './PasswordResetPageLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function useResetForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return { email, setEmail, loading, setLoading, message, setMessage, error, setError };
}

async function postResetRequest(email) {
  const res = await fetch(`${API_BASE_URL}/auth/password-reset/request/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
  });
  return { ok: res.ok, data: await res.json() };
}

async function trySubmitReset(email, setEmail, setMessage, setError) {
  const { ok, data } = await postResetRequest(email);
  if (ok) { setMessage(data.message); setEmail(''); }
  else setError(data.error || 'There was an error, please try again...');
}

function buildSubmitHandler({ email, setEmail, setLoading, setMessage, setError }) {
  return async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try { await trySubmitReset(email, setEmail, setMessage, setError); }
    catch { setError('There was an error, please try again...'); }
    finally { setLoading(false); }
  };
}

function SuccessMessage({ message }) {
  if (!message) return null;
  return (
    <div className={styles.success}>
      <strong>✅ Email Sent!</strong>
      <p>{message}</p>
      <p className={styles.infoText}>Check your inbox for the reset link.</p>
    </div>
  );
}

function ErrorMsg({ error }) {
  if (!error) return null;
  return <div className={styles.error}>{error}</div>;
}

function EmailField({ email, setEmail, loading }) {
  return (
    <div className={styles.field}>
      <label htmlFor="email" className={styles.label}>Email Address</label>
      <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        className={styles.input} required disabled={loading} placeholder="your.email@example.com" />
    </div>
  );
}

function ResetForm({ email, setEmail, loading, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <EmailField email={email} setEmail={setEmail} loading={loading} />
      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  );
}

function ResetCard({ email, setEmail, loading, message, error, onSubmit }) {
  return (
    <div className={styles.formCard}>
      <h1 className={styles.title}>Reset Password</h1>
      <p className={styles.subtitle}>Enter your email address to receive a link to reset your password.</p>
      <SuccessMessage message={message} />
      <ErrorMsg error={error} />
      <ResetForm email={email} setEmail={setEmail} loading={loading} onSubmit={onSubmit} />
      <p className={styles.linkText}>Remember your password?{' '}<Link to="/login" className={styles.link}>Back to Login</Link></p>
    </div>
  );
}

export default function PasswordResetRequest() {
  const form = useResetForm();
  const handleSubmit = buildSubmitHandler(form);
  return (
    <PasswordResetPageLayout>
      <div className={styles.container}><ResetCard {...form} onSubmit={handleSubmit} /></div>
    </PasswordResetPageLayout>
  );
}
