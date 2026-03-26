/*
 * Pixel tree scene for the focus animation.
 */

import styles from '../../../pages/timer/TimerPage.module.css';
import treeStyles from '../TreeAnimation.module.css';
import { FOLIAGE_POINTS, FRUIT_POINTS, POT_POINTS, SOIL_POINTS, TRUNK_POINTS } from './treePixels';

function Pixel({ x, y, cls }) {
  return <rect x={x} y={y} width="1" height="1" className={cls} />;
}

function Points({ points, name }) {
  return points.map(([x, y], index) => <Pixel key={index} x={x} y={y} cls={treeStyles[name]} />);
}

function FullTree() {
  return (
    <>
      <Points name="brown" points={TRUNK_POINTS} />
      <Points name="green" points={FOLIAGE_POINTS} />
      <Points name="red" points={FRUIT_POINTS} />
    </>
  );
}

export function TreeScene({ progress }) {
  const displayProgress = Math.max(15, progress * 100);
  const clipStyle = { clipPath: `inset(${Math.max(0, 100 - displayProgress)}% 0 0 0)`, transition: 'clip-path 1s linear' };

  return (
    <svg viewBox="0 0 20 24" className={`${treeStyles.svg} ${styles.treeGhostLayer}`} shapeRendering="crispEdges">
      <Points name="pot" points={POT_POINTS} />
      <Points name="soil" points={SOIL_POINTS} />
      <g style={clipStyle}><FullTree /></g>
    </svg>
  );
}
