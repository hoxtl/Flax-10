/**
 * Campus map shell layout.
 */
import styles from "../../pages/CampusMap/CampusMap.module.css";
import { CampusMapMapPane } from "./CampusMapMapPane";
import { CampusMapSidebar } from "./CampusMapSidebar";
import { CampusMapSkeleton } from "./CampusMapSkeleton";

export function CampusMapShell(props) {
  return (
    <div className={styles.page}>{props.showInitialSkeleton && <CampusMapSkeleton />}<CampusMapSidebar {...props} /><CampusMapMapPane {...props} /></div>
  );
}
