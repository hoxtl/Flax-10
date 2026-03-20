import StandardModal from "../../../components/common/StandardModal/StandardModal";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import { computeListSidebarCounts } from "../utils/listSidebarUtils";
import { getListColor } from "../utils/listColorUtils";
import styles from "./MobileTaskListsModal.module.css";

function ListRow({ list, index, count, active, onClick }) {
  const color = getListColor(list, index);
  return (
    <button
      type="button"
      className={`${styles.listRow} ${active ? styles.listRowActive : ""}`}
      onClick={onClick}
    >
      <span className={styles.listDot} style={{ background: color }} />
      <span className={styles.listName}>{list.name}</span>
      {count > 0 && <span className={styles.listCount}>{count}</span>}
    </button>
  );
}

