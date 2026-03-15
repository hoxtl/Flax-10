import { useState, useRef, useEffect } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import treeStyles from './TreeAnimation.module.css';

const ANIM_KEY = 'focusAnimationType';
const ANIM_TYPES = [
    { id: 'tree',   icon: '🌱', label: 'Tree' },
    { id: 'orb',    icon: '🔮', label: 'Orb' },
    { id: 'fire',   icon: '🔥', label: 'Fire' },
    { id: 'ripple', icon: '〰️', label: 'Ripple' },
    { id: 'galaxy', icon: '✨', label: 'Galaxy' },
];

// ── Tree sub-components ───────────────────────────────────────────────────────

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

function TreeAnim({ progress }) {
    const displayProgress = Math.max(15, progress * 100);
    const clipStyle = {
        clipPath: `inset(${Math.max(0, 100 - displayProgress)}% 0 0 0)`,
        transition: 'clip-path 1s linear',
    };
    return (
        <div className={styles.treeAnimContainer}>
            {/* Ghost outline layer — always visible */}
            <svg viewBox="0 0 20 24" className={treeStyles.svg} shapeRendering="crispEdges" style={{ opacity: 0.18 }}>
                <Pot /><Soil /><FullTree />
            </svg>
            {/* Progress layer — grows from bottom */}
            <svg viewBox="0 0 20 24" className={`${treeStyles.svg} ${styles.treeGhostLayer}`} shapeRendering="crispEdges">
                <Pot />
                <Soil />
                <g style={clipStyle}><FullTree /></g>
            </svg>
        </div>
    );
}

// ── Orb sub-component ────────────────────────────────────────────────────────

function OrbAnim({ mode, isActive }) {
    const color = !isActive
        ? 'var(--muted)'
        : mode === 'break' ? 'var(--sage)' : 'var(--primary)';
    const animClass = !isActive
        ? styles.orbIdleBreathe
        : mode === 'break' ? styles.orbBreakPulse : styles.orbFocusPulse;
    return (
        <div className={styles.orbContainer}>
            <div className={styles.orbGhost} style={{ background: color }} />
            <div className={`${styles.orbActive} ${animClass}`} style={{ background: color }} />
        </div>
    );
}

// ── Fire sub-component ───────────────────────────────────────────────────────

function FireAnim({ mode, isActive }) {
    const sizeClass = !isActive
        ? styles.fireIdle
        : mode === 'break' ? styles.fireBreak : styles.fireFocus;
    return (
        <div className={`${styles.fireWrap} ${sizeClass}`}>
            <div className={styles.fireBase} />
            <div className={styles.fireMid} />
            <div className={styles.fireTip} />
            <div className={styles.fireEmber} />
        </div>
    );
}

// ── Ripple sub-component ─────────────────────────────────────────────────────

function RippleAnim({ mode, isActive }) {
    const color = !isActive
        ? 'var(--muted)'
        : mode === 'break' ? 'var(--sage)' : 'var(--primary)';
    const duration = !isActive ? 7 : mode === 'break' ? 4.5 : 2.5;
    const baseOpacity = !isActive ? 0.35 : 1;
    return (
        <div className={styles.rippleContainer}>
            <svg viewBox="0 0 160 160" width="160" height="160">
                {[0, 1, 2, 3].map(i => (
                    <circle
                        key={i}
                        cx="80" cy="80" r="72"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        className={styles.rippleCircle}
                        style={{
                            animationDuration: `${duration}s`,
                            animationDelay: `${i * (duration / 4)}s`,
                            opacity: baseOpacity,
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

// ── Galaxy sub-component ─────────────────────────────────────────────────────

function GalaxyAnim({ mode, isActive }) {
    const canvasRef = useRef(null);
    const modeRef = useRef(mode);
    const activeRef = useRef(isActive);

    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { activeRef.current = isActive; }, [isActive]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const particles = Array.from({ length: 40 }, () => ({
            angle: Math.random() * Math.PI * 2,
            dist: 10 + Math.random() * 60,
            speed: 0.3 + Math.random() * 0.7,
            size: 0.8 + Math.random() * 1.8,
            opacity: 0.3 + Math.random() * 0.65,
        }));

        let rafId;
        function draw() {
            ctx.clearRect(0, 0, 160, 160);
            const speedMult = !activeRef.current ? 0.4 : modeRef.current === 'work' ? 2.5 : 1.0;
            const hue = modeRef.current === 'work' ? 210 : 150;
            particles.forEach(p => {
                p.angle += p.speed * speedMult * 0.01;
                const x = 80 + Math.cos(p.angle) * p.dist;
                const y = 80 + Math.sin(p.angle) * p.dist;
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${p.opacity})`;
                ctx.fill();
            });
            rafId = requestAnimationFrame(draw);
        }
        draw();
        return () => cancelAnimationFrame(rafId);
    }, []);

    return <canvas ref={canvasRef} width="160" height="160" className={styles.galaxyCanvas} />;
}

// ── Main FocusAnimation component ────────────────────────────────────────────

export default function FocusAnimation({ progress, mode, isActive }) {
    const [animType, setAnimType] = useState(
        () => localStorage.getItem(ANIM_KEY) || 'tree'
    );

    const handlePick = (id) => {
        setAnimType(id);
        try { localStorage.setItem(ANIM_KEY, id); } catch {}
    };

    const anim = animType === 'orb'    ? <OrbAnim mode={mode} isActive={isActive} />
               : animType === 'fire'   ? <FireAnim mode={mode} isActive={isActive} />
               : animType === 'ripple' ? <RippleAnim mode={mode} isActive={isActive} />
               : animType === 'galaxy' ? <GalaxyAnim mode={mode} isActive={isActive} />
               : <TreeAnim progress={progress} />;

    return (
        <div className={styles.focusAnimWrapper}>
            <div className={styles.focusAnimArea}>{anim}</div>
            <div className={styles.animPicker}>
                {ANIM_TYPES.map(a => (
                    <button
                        key={a.id}
                        className={`${styles.animPickerBtn} ${animType === a.id ? styles.animPickerBtnActive : ''}`}
                        title={a.label}
                        onClick={() => handlePick(a.id)}
                    >
                        {a.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}
