import styles from './TreeAnimation.module.css';

export default function TreeAnimation({ progress, mode }) {
    // Pixel art colors
    const C = {
        brown: '#78350f',
        green: '#22c55e',
        lightGreen: '#4ade80',
        darkGreen: '#15803d',
        red: '#ef4444',
        pot: '#d97706',
        soil: '#573010'
    };

    const P = ({ x, y, c }) => (
        <rect x={x} y={y} width="1" height="1" fill={c} />
    );

    // Render the static pot and soil
    const PotAndSoil = () => (
        <>
            <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
            <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
            <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
        </>
    );

    // Render the full tree (Trunk + Foliage + Fruits)
    const FullTree = () => (
        <>
            {/* Trunk - Tall */}
            <P x={9} y={21} c={C.brown} /><P x={10} y={21} c={C.brown} />
            <P x={9} y={20} c={C.brown} /><P x={10} y={20} c={C.brown} />
            <P x={9} y={19} c={C.brown} /><P x={10} y={19} c={C.brown} />
            <P x={9} y={18} c={C.brown} /><P x={10} y={18} c={C.brown} />
            <P x={9} y={17} c={C.brown} /><P x={10} y={17} c={C.brown} />

            {/* Foliage - BIG */}
            <P x={6} y={16} c={C.green} /><P x={7} y={16} c={C.green} /><P x={8} y={16} c={C.green} /><P x={9} y={16} c={C.green} /><P x={10} y={16} c={C.green} /><P x={11} y={16} c={C.green} /><P x={12} y={16} c={C.green} /><P x={13} y={16} c={C.green} />
            <P x={5} y={15} c={C.green} /><P x={6} y={15} c={C.green} /><P x={7} y={15} c={C.green} /><P x={8} y={15} c={C.green} /><P x={9} y={15} c={C.green} /><P x={10} y={15} c={C.green} /><P x={11} y={15} c={C.green} /><P x={12} y={15} c={C.green} /><P x={13} y={15} c={C.green} /><P x={14} y={15} c={C.green} />
            <P x={4} y={14} c={C.green} /><P x={5} y={14} c={C.green} /><P x={6} y={14} c={C.green} /><P x={7} y={14} c={C.green} /><P x={8} y={14} c={C.green} /><P x={9} y={14} c={C.green} /><P x={10} y={14} c={C.green} /><P x={11} y={14} c={C.green} /><P x={12} y={14} c={C.green} /><P x={13} y={14} c={C.green} /><P x={14} y={14} c={C.green} /><P x={15} y={14} c={C.green} />
            <P x={5} y={13} c={C.green} /><P x={6} y={13} c={C.green} /><P x={7} y={13} c={C.green} /><P x={8} y={13} c={C.green} /><P x={9} y={13} c={C.green} /><P x={10} y={13} c={C.green} /><P x={11} y={13} c={C.green} /><P x={12} y={13} c={C.green} /><P x={13} y={13} c={C.green} /><P x={14} y={13} c={C.green} />
            <P x={6} y={12} c={C.green} /><P x={7} y={12} c={C.green} /><P x={8} y={12} c={C.green} /><P x={9} y={12} c={C.green} /><P x={10} y={12} c={C.green} /><P x={11} y={12} c={C.green} /><P x={12} y={12} c={C.green} /><P x={13} y={12} c={C.green} />
            <P x={7} y={11} c={C.green} /><P x={8} y={11} c={C.green} /><P x={9} y={11} c={C.green} /><P x={10} y={11} c={C.green} /><P x={11} y={11} c={C.green} /><P x={12} y={11} c={C.green} />
            <P x={8} y={10} c={C.green} /><P x={9} y={10} c={C.green} /><P x={10} y={10} c={C.green} /><P x={11} y={10} c={C.green} />
            {/* Fruits/Decor */}
            <P x={6} y={15} c={C.red} /><P x={13} y={14} c={C.red} /><P x={9} y={12} c={C.red} /><P x={11} y={11} c={C.red} />
        </>
    );

    // Calculate Y for clip path
    // The tree grows from y=21 (bottom of trunk) up to y=10 (top of leaves).
    // Total height of growth area is roughly 12 units (21 down to 10).
    // But to be simple, let's just reveal from bottom (y=24) to top (y=0).

    // progress 0 -> percentHidden = 100%. Visible part = 0.
    // progress 100 -> percentHidden = 0%. Visible part = 100.

    // We want to ALWAYS show the pot/soil. So we render PotAndSoil separately.
    // Then we render FullTree with a clip path.
    // However, the Trunk starts at y=21.
    // If we use simple percentage clip, at 10% progress, we show bottom 10% of image (y=21.6 to 24).
    // The trunk is at y=21. So at 0-10% strictly nothing of the tree is seen.
    // This is good! It mimics the "Seed" phase where it's underground.

    const percentHidden = Math.max(0, Math.min(100, 100 - progress));
    const clipPathValue = `inset(${percentHidden}% 0 0 0)`;

    return (
        <div className={styles.container}>
            <div className={styles.scene}>
                <svg viewBox="0 0 20 24" className={styles.svg} shapeRendering="crispEdges">
                    {/* Always visible base */}
                    <PotAndSoil />

                    {/* Growing Tree - Revealed from bottom up */}
                    <g style={{ clipPath: clipPathValue, transition: 'clip-path 1s linear' }}>
                        <FullTree />
                    </g>
                </svg>
            </div>
        </div>
    );
}
