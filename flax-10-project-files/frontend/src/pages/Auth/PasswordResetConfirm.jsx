import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PasswordReset.module.css';
import PasswordResetPageLayout from './PasswordResetPageLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function AuthBrand() {
  return (
    <div className={styles.success}>
      <strong>✅ Success!</strong>
      <p>{success}</p>
      <p className={styles.infoText}>Redirecting to login page...</p>
    </div>
  );
}

function PasswordField({ id, label, value, onChange, loading }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <input id={id} name={id} type="password" value={value} onChange={onChange}
        className={styles.input} required minLength={8} disabled={loading}
        placeholder={`Enter ${label.toLowerCase()}`} />
    </div>
  );
}

function ConfirmForm({ formData, loading, onSubmit, onChange }) {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <PasswordField id="new_password" label="New Password" value={formData.new_password} onChange={onChange} loading={loading} />
      <small className={styles.hintText}>Minimum Length: 8 characters</small>
      <PasswordField id="confirm_password" label="Confirm New Password" value={formData.confirm_password} onChange={onChange} loading={loading} />
      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </button>
    </form>
  );
}

function ResetCard({ formData, loading, error, success, passwordError, onSubmit, onChange }) {
  return (
    <div className={styles.formCard}>
      <h1 className={styles.title}>Reset Your Password</h1>
      <p className={styles.subtitle}>Enter your new password below. Ensure it is at least 8 characters long.</p>
      <SuccessMessage success={success} />
      {error && <div className={styles.error}>{error}</div>}
      {passwordError && <div className={styles.error}>{passwordError}</div>}
      {!success && <ConfirmForm formData={formData} loading={loading} onSubmit={onSubmit} onChange={onChange} />}
    </div>
  );
}

export default function PasswordResetConfirm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    if (passwordError) {
      setPasswordError('');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setPasswordError('');

    if (formData.new_password !== formData.confirm_password) {
      setPasswordError('The two passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || data.confirm_password || 'Failed to reset password');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <PasswordResetPageLayout>
      <div className={styles.container}>
        <ResetCard {...form} onSubmit={handleSubmit} onChange={form.handleChange} />
      </div>
    </PasswordResetPageLayout>
  );
}
