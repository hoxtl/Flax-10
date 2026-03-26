/**
 * Word-loader character renderer.
 */

import { AnimatePresence, motion } from "framer-motion";
import styles from "../WordLoader.module.css";

const charVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.04, duration: 0.4, ease: "easeOut" },
  }),
  exit: (index) => ({
    opacity: 0,
    y: -5,
    transition: { delay: index * 0.04, duration: 0.3, ease: "easeIn" },
  }),
};

const MotionSpan = motion.span;

export function WordLoaderCharacters({ index, word }) {
  return (
    <AnimatePresence mode="wait">
      <MotionSpan key={index} className={styles.charSpan}>
        {word.split("").map((character, characterIndex) => <WordCharacter key={characterIndex} character={character} index={characterIndex} />)}
      </MotionSpan>
    </AnimatePresence>
  );
}

function WordCharacter({ character, index }) {
  return <MotionSpan custom={index} variants={charVariants} initial="hidden" animate="visible" exit="exit">{character === " " ? "\u00A0" : character}</MotionSpan>;
}
