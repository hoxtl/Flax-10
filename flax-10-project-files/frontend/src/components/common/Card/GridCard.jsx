import styles from "./GridCard.module.css";

export default function GridCard({ children, className = "", style, onClick }) {
  return (
    <div
      className={`${styles.card} ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
