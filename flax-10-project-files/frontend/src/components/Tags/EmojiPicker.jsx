/*
 * Emoji picker entry component.
 */

import { EmojiPicker as EmojiPickerPrimitive } from "frimousse";
import styles from "./EmojiPicker.module.css";
import {
  EmojiPickerFooter,
  EmojiPickerSearchBar,
  EmojiPickerViewport,
} from "./emojiPicker/EmojiPickerParts";

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <div className={styles.wrapper}>
      <EmojiPickerPrimitive.Root className={styles.picker}>
        <EmojiPickerSearchBar />
        <EmojiPickerViewport onEmojiClick={(emoji) => handleEmojiSelect({ emoji, onClose, onSelect })} />
        <EmojiPickerFooter />
      </EmojiPickerPrimitive.Root>
    </div>
  );
}

function handleEmojiSelect({ emoji, onClose, onSelect }) {
  onSelect?.(emoji.emoji);
  onClose?.();
}
