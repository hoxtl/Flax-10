import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PasswordReset.module.css';
import AuthHeroGeometric from '../components/Authentication/AuthHeroGeometric';
import { AuthBrand, AuthFooter } from '../components/Authentication/AuthBranding';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.error || 'There was an error, please try again...');
      }
    } catch (err) {
      setError('There was an error, please try again...');
    } finally {
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
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>
              Enter your email address to receive a link to reset your password.
            </p>

            {message && (
              <div className={styles.success}>
                <strong>✅ Email Sent!</strong>
                <p>{message}</p>
                <p style={{ marginTop: '10px', fontSize: '0.9em' }}>Check your inbox for the reset link.</p>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                  placeholder="your.email@example.com"
                />
              </div>
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className={styles.linkText}>
              Remember your password?{' '}
              <Link to="/login" className={styles.link}>Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}