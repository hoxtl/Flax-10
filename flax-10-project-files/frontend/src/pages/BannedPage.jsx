import { motion } from 'framer-motion';

export default function BannedPage({ reason }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #f9fafb)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 240, damping: 18 }}
        style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1.5rem' }}
      >
        🚫
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.22, duration: 0.3 }}
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
          fontWeight: 700,
          margin: '0 0 0.75rem',
          color: 'var(--text, #111)',
          letterSpacing: '-0.3px',
        }}
      >
        Your account has been suspended
      </motion.h1>

      {/* Reason */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ delay: 0.32, duration: 0.3 }}
        style={{
          color: 'var(--muted, #6b7280)',
          maxWidth: 460,
          margin: '0 0 1rem',
          fontSize: '1rem',
          lineHeight: 1.6,
        }}
      >
        {reason ? (
          <>
            Reason: <strong style={{ color: 'var(--text, #111)' }}>{reason}</strong>
          </>
        ) : (
          'Your account has been suspended by an administrator.'
        )}
      </motion.p>

      {/* Support line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        style={{
          fontSize: '0.85rem',
          color: 'var(--muted, #9ca3af)',
          margin: 0,
        }}
      >
        If you believe this is a mistake, contact{' '}
        <a
          href="mailto:support@studyflax.com"
          style={{ color: 'var(--accent, #6c47ff)', textDecoration: 'underline' }}
        >
          support@studyflax.com
        </a>
      </motion.p>
    </motion.div>
  );
}
