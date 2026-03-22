import { AnimatePresence, motion } from "framer-motion";
import { DASH_WRAP_STYLE, DASH_MOTION } from "../constants";
import { DashboardContent } from "./DashboardContent";

export function AnimatedDashboardContent({ activeNav, setActiveNav, user, onNavChange }) {
  return (
    <div style={DASH_WRAP_STYLE}>
      <AnimatePresence>
        <motion.div key={activeNav} {...DASH_MOTION}>
          <DashboardContent activeNav={activeNav} setActiveNav={setActiveNav} user={user} onNavChange={onNavChange} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
