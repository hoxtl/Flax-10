import { motion } from "framer-motion";
import styles from "./AuthHeroGeometric.module.css";

function ElegantShape({
  className,
  delay = 0,
  width = 520,
  height = 120,
  rotate = 0,
  from = "rgba(158,126,93,0.26)", 
  border = "rgba(74,52,33,0.26)", 
  driftX = 10,
  driftY = 22,
  floatDuration = 9.5,
}) {
  return (
    <motion.div
      className={`${styles.shapeWrap} ${className || ""}`}
      initial={{ opacity: 0, y: -140, rotate: rotate - 14 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.1,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.1 },
      }}
    >
      <motion.div
        className={styles.shape}
        animate={{
          y: [0, driftY, 0],
          x: [0, -driftX, 0, driftX, 0],
          rotate: [0, 1.2, 0, -1.2, 0],
        }}
        transition={{
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width, height }}
      >
        <div
          className={styles.shapeInner}
          style={{
            background: `linear-gradient(90deg, ${from}, rgba(255,255,255,0))`,
            borderColor: border,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function AuthHeroGeometric() {
  return (
    <div className={styles.hero} aria-hidden="true">
      <div className={styles.glow} />

      <div className={styles.layer}>
        <ElegantShape
          delay={0.25}
          width={640}
          height={160}
          rotate={12}
          from="rgba(158,126,93,0.30)"
          driftX={14}
          driftY={26}
          floatDuration={10}
          className={styles.leftTop}
        />
        <ElegantShape
          delay={0.45}
          width={540}
          height={140}
          rotate={-14}
          from="rgba(170,154,148,0.26)"
          driftX={16}
          driftY={24}
          floatDuration={9.2}
          className={styles.rightMid}
        />
        <ElegantShape
          delay={0.35}
          width={340}
          height={96}
          rotate={-8}
          from="rgba(180,164,144,0.28)"
          driftX={12}
          driftY={22}
          floatDuration={8.8}
          className={styles.leftBottom}
        />
        <ElegantShape
          delay={0.55}
          width={240}
          height={70}
          rotate={18}
          from="rgba(158,126,93,0.24)"
          driftX={10}
          driftY={18}
          floatDuration={8.4}
          className={styles.rightTop}
        />
        <ElegantShape
          delay={0.65}
          width={180}
          height={52}
          rotate={-22}
          from="rgba(74,52,33,0.18)"
          driftX={10}
          driftY={16}
          floatDuration={8.0}
          className={styles.leftSmall}
        />
      </div>

      <div className={styles.fade} />
    </div>
  );
}
