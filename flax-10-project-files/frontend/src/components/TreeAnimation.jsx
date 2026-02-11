import styles from './TreeAnimation.module.css';

const Pixel = ({ x, y, cls }) => <rect x={x} y={y} width="1" height="1" className={cls} />;

const Points = ({ pts, name }) => pts.map(([x, y], i) => <Pixel key={i} x={x} y={y} cls={styles[name]} />);

const Pot = () => (
    <Points name="pot" pts={[
        [8, 23], [9, 23], [10, 23], [11, 23], [7, 22], [12, 22]
    ]} />
);

const Soil = () => (
    <Points name="soil" pts={[
        [8, 22], [9, 22], [10, 22], [11, 22]
    ]} />
);

const Trunk = () => (
    <Points name="brown" pts={[
        [9, 21], [10, 21], [9, 20], [10, 20], [9, 19], [10, 19],
        [9, 18], [10, 18], [9, 17], [10, 17]
    ]} />
);

const Foliage = () => (
    <Points name="green" pts={[
        [6, 16], [7, 16], [8, 16], [9, 16], [10, 16], [11, 16], [12, 16], [13, 16],
        [5, 15], [6, 15], [7, 15], [8, 15], [9, 15], [10, 15], [11, 15], [12, 15], [13, 15], [14, 15],
        [4, 14], [5, 14], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14], [15, 14],
        [5, 13], [6, 13], [7, 13], [8, 13], [9, 13], [10, 13], [11, 13], [12, 13], [13, 13], [14, 13],
        [6, 12], [7, 12], [8, 12], [9, 12], [10, 12], [11, 12], [12, 12], [13, 12],
        [7, 11], [8, 11], [9, 11], [10, 11], [11, 11], [12, 11],
        [8, 10], [9, 10], [10, 10], [11, 10]
    ]} />
);

const Fruits = () => (
    <Points name="red" pts={[[6, 15], [13, 14], [9, 12], [11, 11]]} />
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

export default function TreeAnimation({ progress }) {
    const clipStyle = { clipPath: calculateClip(progress), transition: 'clip-path 1s linear' };

    return (
        <div className={styles.container}>
            <div className={styles.scene}>
                <svg viewBox="0 0 20 24" className={styles.svg} shapeRendering="crispEdges">
                    <Pot />
                    <Soil />
                    <g style={clipStyle}><FullTree /></g>
                </svg>
            </div>
        </div>
    );
}
