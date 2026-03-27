/**
 * Campus map sidebar wrapper.
 */

import { motion } from "framer-motion";
import styles from "../../../pages/campus_map/styles/CampusMap.module.css";
import { CampusMapSidebarContent } from "./CampusMapSidebarContent";

const SHEET_VARIANTS = { closed: { y: "calc(78vh - 76px)" }, mid: { y: "calc(78vh - 320px)" }, open: { y: 0 } };
const MotionAside = motion.aside;

function hiddenStyle(showInitialSkeleton) {
  return showInitialSkeleton ? { visibility: "hidden" } : undefined;
}

function animateValue(ui) {
  return ui.isMobile ? (ui.mobileInitialOpen ? "open" : "closed") : { y: 0 };
}

export function CampusMapSidebar(props) {
  return (
    <MotionAside className={styles.sidebar} style={hiddenStyle(props.showInitialSkeleton)} initial={props.ui.isMobile ? "open" : false} animate={animateValue(props.ui)} drag={props.ui.isMobile ? "y" : false} dragConstraints={{ top: 0, bottom: 500 }} dragElastic={0.1} variants={SHEET_VARIANTS}><div className={styles.dragHandle} /><CampusMapSidebarContent {...props} /></MotionAside>
  );
}
