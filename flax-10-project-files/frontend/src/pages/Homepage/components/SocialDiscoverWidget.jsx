import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, ChevronRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { useSocieties } from "../../../components/Society/hooks/useSocieties";
import styles from "./SocialDiscoverWidget.module.css";

const AVATAR_COLORS = ["#8B7355", "#7BA3C4", "#B38B8B", "#C4A46D"];

const MOCK_COURSEMATES = [
  { id: 1, name: "Alex R.",  initial: "A" },
  { id: 2, name: "Priya K.", initial: "P" },
  { id: 3, name: "Sam O.",   initial: "S" },
  { id: 4, name: "Lu C.",    initial: "L" },
];

const avatarContainerVariants = {
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.5, x: -10 },
  visible: {
    opacity: 1, scale: 1, x: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.2 } },
};

function getSocietyMeta(society) {
  if (society.next_event) return { text: society.next_event, color: "#7BB38E" };
  if (society.new_posts_count > 0) return { text: `${society.new_posts_count} new posts`, color: "#C4A46D" };
  if (society.member_count) return { text: `${society.member_count} members · active`, color: "#A89279" };
  return { text: "Active society", color: "#A89279" };
}

export function SocialDiscoverWidget({ coursemates, moduleName, studyTip }) {
  const { societies, loading } = useSocieties();

  const displayCoursemates = coursemates?.length ? coursemates.slice(0, 4) : MOCK_COURSEMATES;
  const coursemateCount = coursemates?.length ?? MOCK_COURSEMATES.length;
  const displayModule = moduleName ?? "your modules";

  const joinedSociety = useMemo(() => {
    if (!societies?.length) return null;
    return societies.find((s) => s.is_member) ?? null;
  }, [societies]);

  const societyMeta = joinedSociety ? getSocietyMeta(joinedSociety) : null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerIconWrap}>
          <Users className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={styles.headerLabel}>Discover</span>
      </div>

      {/* Coursemates section */}
      <div className={styles.coursematesSection}>
        <div className={styles.coursematesRow}>
          <motion.div
            className={styles.avatarStack}
            initial="hidden"
            animate="visible"
            variants={avatarContainerVariants}
          >
            {displayCoursemates.map((cm, i) => (
              <motion.span
                key={cm.id ?? i}
                className={styles.avatar}
                style={{
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  zIndex: displayCoursemates.length - i,
                }}
                variants={avatarVariants}
                title={cm.name}
              >
                {cm.initial ?? cm.name?.[0]?.toUpperCase() ?? "?"}
              </motion.span>
            ))}
          </motion.div>
          <span className={styles.coursemateText}>
            <strong className={styles.coursemateCount}>{coursemateCount} coursemates</strong>
            {" "}in {displayModule}
          </span>
        </div>
        <Link to="/profile" className={styles.subtleLink}>
          Find study partners →
        </Link>
      </div>

      {/* Gradient divider */}
      <div className={styles.divider} />

      {/* Society section */}
      <motion.div
        className={styles.societySection}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <p className={styles.societySpotlightLabel}>Society for you</p>
        {joinedSociety ? (
          <Link to="/societies" className={styles.societyCard}>
            {joinedSociety.cover_image || joinedSociety.image ? (
              <motion.img
                src={joinedSociety.cover_image || joinedSociety.image}
                alt={joinedSociety.name}
                className={styles.societyThumb}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              />
            ) : (
              <motion.div
                className={styles.societyThumbFallback}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                {joinedSociety.name?.[0]?.toUpperCase() ?? "S"}
              </motion.div>
            )}
            <div className={styles.societyInfo}>
              <span className={styles.societyName}>{joinedSociety.name}</span>
              {societyMeta && (
                <span className={styles.societyMeta} style={{ color: societyMeta.color }}>
                  {societyMeta.text}
                </span>
              )}
            </div>
            <ChevronRight size={14} className={styles.societyChevron} aria-hidden />
          </Link>
        ) : loading ? (
          <div className={styles.societyCard}>
            <div className={styles.societyThumbSkeleton} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          </div>
        ) : (
          <p className={styles.noSocietyText}>Not in any societies yet</p>
        )}
        <Link to="/societies" className={styles.subtleLink}>
          View all societies →
        </Link>
      </motion.div>

      {/* Study tip */}
      {(studyTip || true) && (
        <>
          <div className={styles.divider} />
          <div className={styles.studyTipSection}>
            <Lightbulb className={styles.studyTipIcon} size={14} strokeWidth={1.75} aria-hidden />
            <p className={styles.studyTipText}>
              {studyTip || "Your best focus windows are usually in the morning — block time then for deep work."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
