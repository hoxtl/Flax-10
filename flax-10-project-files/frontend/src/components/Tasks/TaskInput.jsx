import styles from "./TaskPanel.module.css";

export default function TaskInput({ text, setText, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className={styles.inputRow}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New Task"
      />
    </form>
  );
}