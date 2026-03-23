/*
 * Presentational pieces for the emoji picker.
 */

import { EmojiPicker as EmojiPickerPrimitive } from "frimousse";
import styles from "../EmojiPicker.module.css";

export function EmojiPickerSearchBar() {
  return (
    <div className={styles.searchWrapper}>
      <span className={styles.searchIcon}>🔍</span>
      <EmojiPickerPrimitive.Search className={styles.searchInput} placeholder="Search emoji..." />
    </div>
  );
}

export function EmojiPickerViewport({ onEmojiClick }) {
  return (
    <EmojiPickerPrimitive.Viewport className={styles.viewport}>
      <EmojiPickerPrimitive.Loading className={styles.loading}>Loading...</EmojiPickerPrimitive.Loading>
      <EmojiPickerPrimitive.Empty className={styles.empty}>No emoji found.</EmojiPickerPrimitive.Empty>
      <EmojiPickerPrimitive.List className={styles.list} components={getEmojiListComponents(onEmojiClick)} />
    </EmojiPickerPrimitive.Viewport>
  );
}

function getEmojiListComponents(onEmojiClick) {
  return {
    Row: EmojiRow,
    Emoji: (props) => <EmojiButton {...props} onClick={onEmojiClick} />,
    CategoryHeader: EmojiCategoryHeader,
  };
}

function EmojiRow({ children, ...props }) {
  return <div {...props} className={styles.row}>{children}</div>;
}

function EmojiButton({ emoji, onClick, ...props }) {
  return (
    <button {...props} className={styles.emojiBtn} onClick={() => onClick?.(emoji)}>
      {emoji.emoji}
    </button>
  );
}

function EmojiCategoryHeader({ category, ...props }) {
  return <div {...props} className={styles.categoryHeader}>{category.label}</div>;
}

export function EmojiPickerFooter() {
  return (
    <div className={styles.footer}>
      <EmojiPickerPrimitive.ActiveEmoji>
        {({ emoji }) => (emoji ? <ActiveEmojiDisplay emoji={emoji} /> : <EmptyFooter />)}
      </EmojiPickerPrimitive.ActiveEmoji>
    </div>
  );
}

function ActiveEmojiDisplay({ emoji }) {
  return (
    <>
      <span className={styles.activeEmoji}>{emoji.emoji}</span>
      <span className={styles.activeLabel}>{emoji.label}</span>
    </>
  );
}

function EmptyFooter() {
  return <span className={styles.emptyFooter}>Select an emoji...</span>;
}
