/**
 * Animated word-loader component.
 */

import { WordLoaderCharacters } from "./word-loader/WordLoaderCharacters";
import { useWordLoader } from "./word-loader/useWordLoader";
import styles from "./word-loader.module.css";

export default function WordLoader({ words, className }) {
  const { index, word } = useWordLoader(words);

  return (
    <div className={[styles.loaderWrapper, className].filter(Boolean).join(" ")}>
      <WordLoaderCharacters index={index} word={word} />
    </div>
  );
}
