import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PasswordReset.module.css';
import AuthHeroGeometric from '../components/Authentication/AuthHeroGeometric';
import { AuthBrand, AuthFooter } from '../components/Authentication/AuthBranding';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function PasswordResetConfirm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (passwordError) setPasswordError('');
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
        body: JSON.stringify({ token, new_password: formData.new_password, confirm_password: formData.confirm_password })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => navigate('/login'), 2000);
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
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <AuthHeroGeometric />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(240,237,232,0.0), rgba(240,237,232,0.55))", zIndex: 0 }} />

      <AuthBrand />
      <AuthFooter absolute />

      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "2rem" }}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            <h1 className={styles.title}>Reset Your Password</h1>
            <p className={styles.subtitle}>
              Enter your new password below. Ensure it is at least 8 characters long.
            </p>

            {success && (
              <div className={styles.success}>
                <strong>✅ Success!</strong>
                <p>{success}</p>
                <p style={{ marginTop: '10px', fontSize: '0.9em' }}>Redirecting to login page...</p>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
            {passwordError && <div className={styles.error}>{passwordError}</div>}

            {!success && (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="new_password" className={styles.label}>New Password</label>
                  <input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    minLength={8}
                    disabled={loading}
                    placeholder="Enter new password"
                  />
                  <small style={{ color: 'var(--muted)', fontSize: '0.85em' }}>Minimum Length: 8 characters</small>
                </div>

                <div className={styles.field}>
                  <label htmlFor="confirm_password" className={styles.label}>Confirm New Password</label>
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={styles.input}
                    required
                    minLength={8}
                    disabled={loading}
                    placeholder="Confirm new password"
                  />
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}