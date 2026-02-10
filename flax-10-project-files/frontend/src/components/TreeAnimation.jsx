import styles from './TreeAnimation.module.css';

export default function TreeAnimation({ progress, mode }) {
    // progress is 0 to 100
    // We want the tree to grow from bottom up.
    // We'll use a clip-path or mask. simpler is to have a div with overflow hidden and height %?
    // Actually, SVG masking is smoother.

    // In break mode, show full tree or maybe a coffee cup?
    // For now, let's just keep the tree fully grown during break as a reward.

    const showPercent = mode === 'break' ? 100 : Math.max(5, progress);

    return (
        <div className={styles.container}>
            <div className={styles.scene}>
                {/* Background brightness/sky could change too */}
                <svg viewBox="0 0 200 200" className={styles.svg}>
                    <defs>
                        <clipPath id="grow-clip">
                            {/* 
                                The rect height should grow from bottom (y=200) to top (y=0).
                                y = 200 - (200 * percent / 100)
                                height = 200 * percent / 100
                            */}
                            <rect
                                x="0"
                                y={200 - (2 * showPercent)}
                                width="200"
                                height={2 * showPercent}
                            />
                        </clipPath>
                    </defs>

                    {/* Ground */}
                    <path d="M0 180 Q100 170 200 180 L200 200 L0 200 Z" fill="#86efac" />

                    {/* Tree Group with Clip Path */}
                    <g clipPath="url(#grow-clip)">
                        {/* Trunk */}
                        <path d="M90 180 L90 120 Q90 100 80 80 L90 120 L110 120 L110 180 Z" fill="#78350f" stroke="#78350f" strokeWidth="10" />

                        {/* Leaves / Crown */}
                        {/* A simple fluffy tree shape */}
                        <circle cx="100" cy="80" r="40" fill="#22c55e" />
                        <circle cx="70" cy="90" r="30" fill="#22c55e" />
                        <circle cx="130" cy="90" r="30" fill="#22c55e" />
                        <circle cx="100" cy="50" r="30" fill="#4ade80" />

                        {/* Some fruits/decorations */}
                        <circle cx="110" cy="70" r="5" fill="#ef4444" />
                        <circle cx="90" cy="90" r="5" fill="#ef4444" />
                        <circle cx="80" cy="60" r="5" fill="#ef4444" />
                    </g>

                    {/* Seed/Sprout for low progress? */}
                    {showPercent < 15 && (
                        <path d="M100 180 L100 170 Q100 160 110 160" fill="none" stroke="#22c55e" strokeWidth="3" />
                    )}

                </svg>
            </div>
        </div>
    );
}
