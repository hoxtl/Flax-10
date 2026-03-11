import PageHeader from "../components/common/PageHeader/PageHeader";
import styles from "./AdminPage.module.css";

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <PageHeader
        title="Admin"
        subtitle="Superuser controls — only visible to admin accounts"
      />
      <div className={styles.placeholder}>
        <p>Admin tools coming soon.</p>
      </div>
    </div>
  );
}
