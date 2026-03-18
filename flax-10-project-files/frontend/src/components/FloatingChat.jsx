import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import StudyCoachPanel from './StudyCoachPanel';
import PrimaryButton from './common/PrimaryButton/PrimaryButton';
import styles from './FloatingChat.module.css';

const TASK_PROMPT_MESSAGE = "Hey! I have a task I need to plan. Can you help me figure out how long it might take? Ask me what the task is and I'll describe it.";

function ChatPromptBubble({ onAsk, onMinimize }) {
  return (
    <motion.div
      className={styles.promptBubble}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.promptHeader}>
        <p className={styles.promptText}>Not sure how long a task will take? Ask me!</p>
        <button className={styles.promptMinimize} onClick={onMinimize} aria-label="Minimize"><ChevronDown size={14} /></button>
      </div>
      <div className={styles.promptActions}>
        <PrimaryButton className={styles.promptCta} onClick={onAsk} pill size="small">Ask Flax</PrimaryButton>
      </div>
      <div className={styles.promptArrow} />
    </motion.div>
  );
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const location = useLocation();
  const isTasksPage = location.pathname.startsWith('/tasks');

  useEffect(() => {
    const onOpen = (e) => {
      const msg = e?.detail?.initialMessage;
      setInitialMessage(typeof msg === 'string' ? msg : '');
      setOpen(true);
    };
    window.addEventListener("flax-open-chat", onOpen);
    return () => window.removeEventListener("flax-open-chat", onOpen);
  }, []);

  const handleAsk = () => {
    setInitialMessage(TASK_PROMPT_MESSAGE);
    setOpen(true);
    setMinimized(false);
  };

  const showPrompt = isTasksPage && !open && !minimized;

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
              subtitle="Ask me anything"
              className={styles.windowPanel}
              onClose={() => { setOpen(false); setInitialMessage(''); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrompt && <ChatPromptBubble onAsk={handleAsk} onMinimize={() => setMinimized(true)} />}
      </AnimatePresence>

      <motion.button
        className={styles.fab}
        onClick={() => {
          if (minimized) { setMinimized(false); return; }
          setOpen(o => !o);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? 'Close chat' : minimized ? 'Show prompt' : 'Open chat'}
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
