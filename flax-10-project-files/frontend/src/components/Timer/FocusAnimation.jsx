import { useRef, useEffect } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import treeStyles from './TreeAnimation.module.css';

// ── Tree pixel components ─────────────────────────────────────────────────────

const Pixel = ({ x, y, cls }) => <rect x={x} y={y} width="1" height="1" className={cls} />;
const Points = ({ pts, name }) => pts.map(([x, y], i) => <Pixel key={i} x={x} y={y} cls={treeStyles[name]} />);

const Pot = () => (
    <Points name="pot" pts={[[8,23],[9,23],[10,23],[11,23],[7,22],[12,22]]} />
);
const Soil = () => (
    <Points name="soil" pts={[[8,22],[9,22],[10,22],[11,22]]} />
);
const Trunk = () => (
    <Points name="brown" pts={[
        [9,21],[10,21],[9,20],[10,20],[9,19],[10,19],
        [9,18],[10,18],[9,17],[10,17],[9,16],[10,16],
        [9,15],[10,15],
    ]} />
);
const Foliage = () => (
    <Points name="green" pts={[
        [6,14],[7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],
        [5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
        [4,12],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        [5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
        [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],
        [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],
        [8,8],[9,8],[10,8],[11,8],
    ]} />
);
const Fruits = () => (
    <Points name="red" pts={[[6,13],[13,12],[9,10],[11,9]]} />
);
const FullTree = () => <><Trunk /><Foliage /><Fruits /></>;

// Branch-tip spawn positions (180px canvas; SVG viewBox 20x24 → scale 9px/unit)
const BRANCH_TIPS = [
    { x: 54,  y: 90  },
    { x: 72,  y: 81  },
    { x: 90,  y: 72  },
    { x: 108, y: 81  },
    { x: 126, y: 90  },
    { x: 45,  y: 108 },
    { x: 135, y: 108 },
];

function makeLeaf() {
    const tip = BRANCH_TIPS[Math.floor(Math.random() * BRANCH_TIPS.length)];
    return {
        x: tip.x + (Math.random() - 0.5) * 16,
        y: tip.y + (Math.random() - 0.5) * 12,
        vy: 0.4 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.6,
        life: Math.random(),
        size: 1.5 + Math.random() * 1.5,
        hue: 80 + Math.floor(Math.random() * 40),
    };
}

// ── Main FocusAnimation component ────────────────────────────────────────────

export default function FocusAnimation({ progress, mode, isActive }) {
    const canvasRef = useRef(null);
    const modeRef = useRef(mode);
    const activeRef = useRef(isActive);
    const progressRef = useRef(progress);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { activeRef.current = isActive; }, [isActive]);
    useEffect(() => { progressRef.current = progress; }, [progress]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const leaves = Array.from({ length: 18 }, makeLeaf);
        const sparkles = BRANCH_TIPS.slice(0, 5).map(tip => ({
            x: tip.x,
            y: tip.y,
            phase: Math.random() * Math.PI * 2,
        }));

        let rafId;
        function draw() {
            ctx.clearRect(0, 0, 180, 180);
            const m = modeRef.current;
            const a = activeRef.current;
            const p = progressRef.current;
            const mult = a ? (m === 'work' ? 1.0 : 0.5) : 0.15;

            // Radial glow
            const glowOpacity = 0.08 + p * 0.28;
            const glowColor = m === 'break'
                ? `rgba(52,211,153,${glowOpacity})`
                : `rgba(100,220,80,${glowOpacity})`;
            const grad = ctx.createRadialGradient(90, 110, 0, 90, 110, 72);
            grad.addColorStop(0, glowColor);
            grad.addColorStop(1, 'transparent');
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 180, 180);
            ctx.restore();

            // Leaf particles
            for (const leaf of leaves) {
                leaf.y -= leaf.vy * mult;
                leaf.x += leaf.vx;
                leaf.vx += (Math.random() - 0.5) * 0.08;
                leaf.life -= 0.004 * mult;
                if (leaf.life <= 0) {
                    Object.assign(leaf, makeLeaf());
                    leaf.life = 0.7 + Math.random() * 0.3;
                }
                let color;
                if (!a) {
                    color = `hsla(${leaf.hue},40%,55%,${leaf.life * 0.35})`;
                } else if (m === 'break') {
                    color = `hsla(130,60%,72%,${leaf.life * 0.7})`;
                } else {
                    color = `hsla(${leaf.hue},85%,65%,${leaf.life * 0.85})`;
                }
                ctx.beginPath();
                ctx.arc(leaf.x, leaf.y, leaf.size, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }

            // Sparkles
            for (const sp of sparkles) {
                sp.phase += 0.045 * mult;
                const scale = Math.abs(Math.sin(sp.phase));
                if (scale < 0.05) continue;
                const sz = 3.5 * scale;
                const alpha = scale * (a ? 0.9 : 0.3);
                const hue = m === 'break' ? 140 : 75;
                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.strokeStyle = `hsla(${hue},90%,80%,${alpha})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, -sz); ctx.lineTo(0, sz);
                ctx.moveTo(-sz, 0); ctx.lineTo(sz, 0);
                ctx.stroke();
                ctx.rotate(Math.PI / 4);
                ctx.globalAlpha = alpha * 0.6;
                ctx.beginPath();
                ctx.moveTo(0, -sz * 0.7); ctx.lineTo(0, sz * 0.7);
                ctx.moveTo(-sz * 0.7, 0); ctx.lineTo(sz * 0.7, 0);
                ctx.stroke();
                ctx.restore();
            }

            rafId = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafId);
    }, []);

    const displayProgress = Math.max(15, progress * 100);
    const clipStyle = {
        clipPath: `inset(${Math.max(0, 100 - displayProgress)}% 0 0 0)`,
        transition: 'clip-path 1s linear',
    };

    return (
        <div className={styles.focusAnimWrapper}>
            <div className={styles.focusAnimArea}>
                <div className={styles.treeAnimContainer}>
                    <svg viewBox="0 0 20 24" className={`${treeStyles.svg} ${styles.treeGhostLayer}`} shapeRendering="crispEdges">
                        <Pot />
                        <Soil />
                        <g style={clipStyle}><FullTree /></g>
                    </svg>
                    <canvas
                        ref={canvasRef}
                        width={180}
                        height={180}
                        className={styles.treeCanvasOverlay}
                    />
                </div>
            </div>
        </div>
    );
}
