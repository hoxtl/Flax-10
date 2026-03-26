<<<<<<< HEAD
import Card from "../../../../components/common/card/Card";
import SectionHeader from "../../../../components/common/section_header/SectionHeader";
=======
import Card from "../../../../components/common/Card/Card";
import SectionHeader from "../../../../components/common/SectionHeader/SectionHeader";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
