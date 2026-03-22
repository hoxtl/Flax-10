/**
 * Animated word-loader component.
 */

import { WordLoaderCharacters } from "./word-loader/WordLoaderCharacters";
import { useWordLoader } from "./word-loader/useWordLoader";

export default function WordLoader({ words, className }) {
  const { index, word } = useWordLoader(words);

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "3rem" }}>
      <WordLoaderCharacters index={index} word={word} />
    </div>
  );
}
