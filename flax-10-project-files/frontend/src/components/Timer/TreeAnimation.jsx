/*
 * Timer feature file.
 */

import styles from './TreeAnimation.module.css';
import { FOLIAGE_POINTS, FRUIT_POINTS, POT_POINTS, SOIL_POINTS, TRUNK_POINTS } from './focusAnimation/treePixels';

const Pixel = ({ x, y, cls }) => <rect x={x} y={y} width="1" height="1" className={cls} />;

const Points = ({ pts, name }) => pts.map(([x, y], i) => <Pixel key={i} x={x} y={y} cls={styles[name]} />);

const Pot = () => (
    <Points name="pot" pts={POT_POINTS} />
);

const Soil = () => (
    <Points name="soil" pts={SOIL_POINTS} />
);

const Trunk = () => (
    <Points name="brown" pts={TRUNK_POINTS} />
);

const Foliage = () => (
    <Points name="green" pts={FOLIAGE_POINTS} />
);

const Fruits = () => (
    <Points name="red" pts={FRUIT_POINTS} />
);

const FullTree = () => (
    <>
        <Trunk />
        <Foliage />
        <Fruits />
    </>
);

const calculateClip = (progress) => {
    const percentHidden = Math.max(0, Math.min(100, 100 - progress));
    return `inset(${percentHidden}% 0 0 0)`;
};

const TreeSvg = ({ style }) => (
    <svg viewBox="0 0 20 24" className={styles.svg} shapeRendering="crispEdges">
        <Pot />
        <Soil />
        <g style={style}><FullTree /></g>
    </svg>
);

const TreeScene = ({ progress }) => {
    const displayProgress = Math.max(15, progress);
    const clipStyle = { clipPath: calculateClip(displayProgress), transition: 'clip-path 1s linear' };
    return (
        <div className={styles.scene}>
            <TreeSvg style={clipStyle} />
        </div>
    );
};

export default function TreeAnimation({ progress }) {
    return (
        <div className={styles.container}>
            <TreeScene progress={progress} />
        </div>
    );
}
