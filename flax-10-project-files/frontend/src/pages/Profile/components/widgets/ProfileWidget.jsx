import Card from "../../../../components/Common/Card/Card";
import SectionHeader from "../../../../components/Common/SectionHeader/SectionHeader";
import styles from "./ProfileWidgets.module.css";

export default function ProfileWidget({ title, subtitle, action, onClick, children, className = "" }) {
  return (
    <Card
      className={`${styles.glassCard} ${styles.widgetBox} ${className}`}
      variant="glass"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <SectionHeader title={title} subtitle={subtitle} action={action} className={styles.widgetHeader} />
      <div className={styles.widgetContent}>{children}</div>
    </Card>
  );
}
