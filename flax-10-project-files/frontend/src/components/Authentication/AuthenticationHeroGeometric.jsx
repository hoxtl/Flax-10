import { motion } from "framer-motion";
import styles from "./AuthenticationHeroGeometric.module.css";

const ENTER_EASE = [0.23, 0.86, 0.39, 0.96];

const ENTER_TRANSITION = (delay) => ({
  duration: 2.1,
  delay,
  ease: ENTER_EASE,
  opacity: { duration: 1.1 },
});

const ENTER_INITIAL = (rotate) => ({ opacity: 0, y: -140, rotate: rotate - 14 });
const ENTER_ANIMATE = (rotate) => ({ opacity: 1, y: 0, rotate });

const FLOAT_ANIMATE = (driftX, driftY) => ({
  y: [0, driftY, 0],
  x: [0, -driftX, 0, driftX, 0],
  rotate: [0, 1.2, 0, -1.2, 0],
});

const FLOAT_TRANSITION = (floatDuration) => ({
  duration: floatDuration,
  repeat: Infinity,
  ease: "easeInOut",
});

function ShapeInner() {
  return <div className={styles.shapeInner} />;
}

function FloatingShape({ width, height, driftX, driftY, floatDuration }) {
  const shapeStyle = {
    '--shape-width': typeof width === 'number' ? `${width}px` : width,
    '--shape-height': typeof height === 'number' ? `${height}px` : height,
  };
  return (
    <motion.div
      className={styles.shape}
      animate={FLOAT_ANIMATE(driftX, driftY)}
      transition={FLOAT_TRANSITION(floatDuration)}
      style={shapeStyle}
    >
      <ShapeInner />
    </motion.div>
  );
}

const DEFAULT_ELEGANT = {
  delay: 0,
  width: 520,
  height: 120,
  rotate: 0,
  driftX: 10,
  driftY: 22,
  floatDuration: 9.5,
};

function ElegantShape(props) {
  const p = { ...DEFAULT_ELEGANT, ...props };
  return (
    <motion.div className={`${styles.shapeWrap} ${p.className || ""}`} initial={ENTER_INITIAL(p.rotate)} animate={ENTER_ANIMATE(p.rotate)} transition={ENTER_TRANSITION(p.delay)}>
      <FloatingShape width={p.width} height={p.height} driftX={p.driftX} driftY={p.driftY} floatDuration={p.floatDuration} />
    </motion.div>
  );
}

const SHAPES = [
  {
    delay: 0.25,
    width: 640,
    height: 160,
    rotate: 12,
    driftX: 14,
    driftY: 26,
    floatDuration: 10,
    classNameKey: "leftTop",
  },
  {
    delay: 0.45,
    width: 540,
    height: 140,
    rotate: -14,
    driftX: 16,
    driftY: 24,
    floatDuration: 9.2,
    classNameKey: "rightMid",
  },
  {
    delay: 0.35,
    width: 340,
    height: 96,
    rotate: -8,
    driftX: 12,
    driftY: 22,
    floatDuration: 8.8,
    classNameKey: "leftBottom",
  },
  {
    delay: 0.55,
    width: 240,
    height: 70,
    rotate: 18,
    driftX: 10,
    driftY: 18,
    floatDuration: 8.4,
    classNameKey: "rightTop",
  },
  {
    delay: 0.65,
    width: 180,
    height: 52,
    rotate: -22,
    driftX: 10,
    driftY: 16,
    floatDuration: 8.0,
    classNameKey: "leftSmall",
  },
];

function ShapesLayer({ shapes }) {
  return (
    <div className={styles.layer}>
      {shapes.map((p) => (
        <ElegantShape key={p.classNameKey} {...p} className={styles[p.classNameKey]} />
      ))}
    </div>
  );
}

export default function AuthHeroGeometric({ shapes = SHAPES }) {
  return (
    <div className={styles.hero} aria-hidden="true">
      <div className={styles.glow} />
      <ShapesLayer shapes={shapes} />
      <div className={styles.fade} />
    </div>
  );
}
