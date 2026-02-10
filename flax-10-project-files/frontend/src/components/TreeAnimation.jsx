import styles from './TreeAnimation.module.css';

export default function TreeAnimation({ progress, mode }) {
    // Progress is now overall goal progress (0-100)

    // Define 6 stages of growth for a taller tree
    let stage = 0;
    if (progress < 10) stage = 0;      // Seed
    else if (progress < 25) stage = 1; // Sprout
    else if (progress < 45) stage = 2; // Sapling
    else if (progress < 65) stage = 3; // Small Tree
    else if (progress < 90) stage = 4; // Tall Tree
    else stage = 5;                    // Full Grown (with fruit)

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

    // ViewBox changed to 20x24 to allow for a taller tree
    const renderStage = (s) => {
        switch (s) {
            case 0: // Seed
                return (
                    <>
                        {/* Pot at bottom (y=20-23) */}
                        <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
                        <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
                        <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
                        {/* Sprout tip */}
                        <P x={9} y={21} c={C.green} /><P x={10} y={21} c={C.green} />
                    </>
                );
            case 1: // Sprout
                return (
                    <>
                        <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
                        <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
                        <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
                        {/* Stem */}
                        <P x={9} y={21} c={C.green} /><P x={9} y={20} c={C.green} />
                        {/* Leaves */}
                        <P x={8} y={19} c={C.green} /><P x={10} y={19} c={C.green} />
                    </>
                );
            case 2: // Sapling
                return (
                    <>
                        <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
                        <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
                        <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
                        {/* Trunk */}
                        <P x={9} y={21} c={C.brown} /><P x={10} y={21} c={C.brown} />
                        <P x={9} y={20} c={C.brown} /><P x={10} y={20} c={C.brown} />
                        <P x={9} y={19} c={C.brown} />
                        {/* Foliage */}
                        <P x={8} y={18} c={C.green} /><P x={9} y={18} c={C.green} /><P x={10} y={18} c={C.green} /><P x={11} y={18} c={C.green} />
                        <P x={7} y={17} c={C.green} /><P x={8} y={17} c={C.green} /><P x={9} y={17} c={C.green} /><P x={10} y={17} c={C.green} /><P x={11} y={17} c={C.green} />
                        <P x={9} y={16} c={C.green} />
                    </>
                );
            case 3: // Small Tree
                return (
                    <>
                        <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
                        <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
                        <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
                        {/* Trunk */}
                        <P x={9} y={21} c={C.brown} /><P x={10} y={21} c={C.brown} />
                        <P x={9} y={20} c={C.brown} /><P x={10} y={20} c={C.brown} />
                        <P x={9} y={19} c={C.brown} /><P x={10} y={19} c={C.brown} />
                        <P x={9} y={18} c={C.brown} /><P x={10} y={18} c={C.brown} />
                        {/* Foliage - wider and taller */}
                        <P x={7} y={17} c={C.green} /><P x={8} y={17} c={C.green} /><P x={9} y={17} c={C.green} /><P x={10} y={17} c={C.green} /><P x={11} y={17} c={C.green} /><P x={12} y={17} c={C.green} />
                        <P x={6} y={16} c={C.green} /><P x={7} y={16} c={C.green} /><P x={8} y={16} c={C.green} /><P x={9} y={16} c={C.green} /><P x={10} y={16} c={C.green} /><P x={11} y={16} c={C.green} /><P x={12} y={16} c={C.green} /><P x={13} y={16} c={C.green} />
                        <P x={7} y={15} c={C.green} /><P x={8} y={15} c={C.green} /><P x={9} y={15} c={C.green} /><P x={10} y={15} c={C.green} /><P x={11} y={15} c={C.green} /><P x={12} y={15} c={C.green} />
                        <P x={8} y={14} c={C.green} /><P x={9} y={14} c={C.green} /><P x={10} y={14} c={C.green} /><P x={11} y={14} c={C.green} />
                        <P x={9} y={13} c={C.green} /><P x={10} y={13} c={C.green} />
                    </>
                );
            case 4: // Tall Tree
                return (
                    <>
                        <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
                        <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
                        <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
                        {/* Trunk - Taller */}
                        <P x={9} y={21} c={C.brown} /><P x={10} y={21} c={C.brown} />
                        <P x={9} y={20} c={C.brown} /><P x={10} y={20} c={C.brown} />
                        <P x={9} y={19} c={C.brown} /><P x={10} y={19} c={C.brown} />
                        <P x={9} y={18} c={C.brown} /><P x={10} y={18} c={C.brown} />
                        <P x={9} y={17} c={C.brown} /><P x={10} y={17} c={C.brown} />
                        {/* Foliage - moving up */}
                        <P x={6} y={16} c={C.green} /><P x={7} y={16} c={C.green} /><P x={8} y={16} c={C.green} /><P x={9} y={16} c={C.green} /><P x={10} y={16} c={C.green} /><P x={11} y={16} c={C.green} /><P x={12} y={16} c={C.green} /><P x={13} y={16} c={C.green} />
                        <P x={5} y={15} c={C.green} /><P x={6} y={15} c={C.green} /><P x={7} y={15} c={C.green} /><P x={8} y={15} c={C.green} /><P x={9} y={15} c={C.green} /><P x={10} y={15} c={C.green} /><P x={11} y={15} c={C.green} /><P x={12} y={15} c={C.green} /><P x={13} y={15} c={C.green} /><P x={14} y={15} c={C.green} />
                        <P x={6} y={14} c={C.green} /><P x={7} y={14} c={C.green} /><P x={8} y={14} c={C.green} /><P x={9} y={14} c={C.green} /><P x={10} y={14} c={C.green} /><P x={11} y={14} c={C.green} /><P x={12} y={14} c={C.green} /><P x={13} y={14} c={C.green} />
                        <P x={7} y={13} c={C.green} /><P x={8} y={13} c={C.green} /><P x={9} y={13} c={C.green} /><P x={10} y={13} c={C.green} /><P x={11} y={13} c={C.green} /><P x={12} y={13} c={C.green} />
                        <P x={8} y={12} c={C.green} /><P x={9} y={12} c={C.green} /><P x={10} y={12} c={C.green} /><P x={11} y={12} c={C.green} />
                        <P x={9} y={11} c={C.green} /><P x={10} y={11} c={C.green} />
                    </>
                );
            case 5: // Full Grown
                return (
                    <>
                        <P x={8} y={23} c={C.pot} /><P x={9} y={23} c={C.pot} /><P x={10} y={23} c={C.pot} /><P x={11} y={23} c={C.pot} />
                        <P x={7} y={22} c={C.pot} /><P x={12} y={22} c={C.pot} />
                        <P x={8} y={22} c={C.soil} /><P x={9} y={22} c={C.soil} /><P x={10} y={22} c={C.soil} /><P x={11} y={22} c={C.soil} />
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
            default: return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.scene}>
                <svg viewBox="0 0 20 24" className={styles.svg} shapeRendering="crispEdges">
                    {renderStage(stage)}
                </svg>
            </div>
        </div>
    );
}
