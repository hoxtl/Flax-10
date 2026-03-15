import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import StudyCoachPanel from './StudyCoachPanel';
import styles from './FloatingChat.module.css';

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    const onOpen = (e) => {
      const msg = e?.detail?.initialMessage;
      setInitialMessage(typeof msg === 'string' ? msg : '');
      setOpen(true);
    };
    window.addEventListener("flax-open-chat", onOpen);
    return () => window.removeEventListener("flax-open-chat", onOpen);
  }, []);

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.window}
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <StudyCoachPanel
              period={30}
              initialMessage={initialMessage}
              subtitle="Ask about your study habits"
              className={styles.windowPanel}
              onClose={() => { setOpen(false); setInitialMessage(''); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={styles.fab}
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={20} /></motion.span>
            : <motion.span key="open"  initial={{ rotate: 90,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageCircle size={20} /></motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
