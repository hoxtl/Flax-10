/**
 * Animated word-loader component.
 */

import { WordLoaderCharacters } from "./word_loader/WordLoaderCharacters";
import { useWordLoader } from "./word_loader/useWordLoader";
import styles from "./WordLoader.module.css";

export default function WordLoader({ words, className }) {
  const { index, word } = useWordLoader(words);

  return (
    <div className={[styles.loaderWrapper, className].filter(Boolean).join(" ")}>
      <WordLoaderCharacters index={index} word={word} />
    </div>
  );
}
