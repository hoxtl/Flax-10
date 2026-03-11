import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const charVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" },
  }),
  exit: (i) => ({
    opacity: 0,
    y: -5,
    transition: { delay: i * 0.04, duration: 0.3, ease: "easeIn" },
  }),
};

export default function WordLoader({ words, className }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => {
        if (i >= words.length - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [words.length]);

  const word = words[index];

  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "3rem" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          style={{ position: "absolute", display: "flex", gap: "0.05em" }}
        >
          {word.split("").map((char, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={charVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
