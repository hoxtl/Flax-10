/*
 * Canvas particle animation for the focus tree.
 */

import { useEffect, useRef, useState } from 'react';
import { BRANCH_TIPS } from './treePixels';
import canvasColors from './focusCanvasColors.json';

const hslaColor = (h, s, l, a) => `hsl${a < 1 ? 'a' : ''}(${h},${s}%,${l}%${a < 1 ? `,${a}` : ''})`;
const rgbaColor = (rgb, a) => `rgb${a < 1 ? 'a' : ''}(${rgb}${a < 1 ? `,${a}` : ''})`;

function makeLeaf() {
  const tip = BRANCH_TIPS[Math.floor(Math.random() * BRANCH_TIPS.length)];
  return { x: tip.x + (Math.random() - 0.5) * 16, y: tip.y + (Math.random() - 0.5) * 12, vy: 0.4 + Math.random() * 1.2, vx: (Math.random() - 0.5) * 0.6, life: Math.random(), size: 1.5 + Math.random() * 1.5, hue: 80 + Math.floor(Math.random() * 40) };
}

function buildSparkles() {
  return BRANCH_TIPS.slice(0, 5).map((tip) => ({ x: tip.x, y: tip.y, phase: Math.random() * Math.PI * 2 }));
}

function getMotionState(mode, isActive, progress) {
  const intensity = isActive ? (mode === 'work' ? 1 : 0.5) : 0.15;
  return { mode, isActive, progress, intensity };
}

function getGlowColor(state) {
  const opacity = 0.08 + state.progress * 0.28;
  const rgb = state.mode === 'break' ? canvasColors.glowBreakBase : canvasColors.glowWorkBase;
  return rgbaColor(rgb, opacity);
}

function drawGlow(ctx, color) {
  if (typeof ctx.createRadialGradient === 'function') return drawGradientGlow(ctx, color);
  ctx.fillStyle = color;
  if (typeof ctx.fillRect === 'function') ctx.fillRect(0, 0, 180, 180);
}

function drawGradientGlow(ctx, color) {
  const gradient = ctx.createRadialGradient(90, 110, 0, 90, 110, 72);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 180, 180);
  ctx.restore();
}

function resetLeaf(leaf) {
  Object.assign(leaf, makeLeaf());
  leaf.life = 0.7 + Math.random() * 0.3;
}

function getLeafColor(leaf, state) {
  if (!state.isActive) return hslaColor(leaf.hue, 40, 55, leaf.life * 0.35);
  if (state.mode === 'break') return hslaColor(130, 60, 72, leaf.life * 0.7);
  return hslaColor(leaf.hue, 85, 65, leaf.life * 0.85);
}

function updateLeaf(leaf, state) {
  leaf.y -= leaf.vy * state.intensity;
  leaf.x += leaf.vx;
  leaf.vx += (Math.random() - 0.5) * 0.08;
  leaf.life -= 0.004 * state.intensity;
  if (leaf.life <= 0) resetLeaf(leaf);
}

function drawLeaves(ctx, leaves, state) {
  leaves.forEach((leaf) => drawLeaf(ctx, leaf, state));
}

function drawLeaf(ctx, leaf, state) {
  updateLeaf(leaf, state);
  ctx.beginPath();
  ctx.arc(leaf.x, leaf.y, leaf.size, 0, Math.PI * 2);
  ctx.fillStyle = getLeafColor(leaf, state);
  ctx.fill();
}

function canDrawSparkles(ctx) {
  return ['save', 'translate', 'rotate', 'moveTo', 'lineTo', 'stroke'].every((key) => typeof ctx[key] === 'function');
}

function drawSparkles(ctx, sparkles, state) {
  if (!canDrawSparkles(ctx)) return;
  sparkles.forEach((sparkle) => drawSparkle(ctx, sparkle, state));
}

function drawSparkle(ctx, sparkle, state) {
  sparkle.phase += 0.045 * state.intensity;
  const scale = Math.abs(Math.sin(sparkle.phase));
  if (scale < 0.05) return;
  const hue = state.mode === 'break' ? 140 : 75;
  renderSparkle(ctx, sparkle, scale, hue, state.isActive);
}

function renderSparkle(ctx, sparkle, scale, hue, isActive) {
  const size = 3.5 * scale;
  const alpha = scale * (isActive ? 0.9 : 0.3);
  ctx.save();
  ctx.translate(sparkle.x, sparkle.y);
  ctx.strokeStyle = hslaColor(hue, 90, 80, alpha);
  ctx.lineWidth = 1.2;
  drawSparkleCross(ctx, size);
  ctx.rotate(Math.PI / 4);
  ctx.globalAlpha = alpha * 0.6;
  drawSparkleCross(ctx, size * 0.7);
  ctx.restore();
}

function drawSparkleCross(ctx, size) {
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(0, size);
  ctx.moveTo(-size, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();
}

function useAnimationType() {
  const [animationType, setAnimationType] = useState(loadAnimationType);
  return { animationType, setAnimationType: (nextType) => persistAnimationType(nextType, setAnimationType) };
}

function loadAnimationType() {
  try {
    return localStorage.getItem('focusAnimationType') || 'tree';
  } catch {
    return 'tree';
  }
}

function persistAnimationType(nextType, setAnimationType) {
  setAnimationType(nextType);
  try { localStorage.setItem('focusAnimationType', nextType); } catch {}
}

export function useFocusCanvasAnimation(mode, isActive, progress) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ mode, isActive, progress });
  const animationType = useAnimationType();

  useEffect(() => { stateRef.current = { mode, isActive, progress }; }, [mode, isActive, progress]);
  useEffect(() => startCanvasLoop(canvasRef, stateRef), []);
  return { canvasRef, ...animationType };
}

function startCanvasLoop(canvasRef, stateRef) {
  const canvas = canvasRef.current;
  if (!canvas) return undefined;
  const ctx = canvas.getContext('2d');
  const leaves = Array.from({ length: 18 }, makeLeaf);
  const sparkles = buildSparkles();
  let rafId = 0;

  const drawFrame = () => {
    drawScene(ctx, leaves, sparkles, stateRef.current);
    rafId = requestAnimationFrame(drawFrame);
  };

  drawFrame();
  return () => cancelAnimationFrame(rafId);
}

function drawScene(ctx, leaves, sparkles, currentState) {
  const state = getMotionState(currentState.mode, currentState.isActive, currentState.progress);
  ctx.clearRect(0, 0, 180, 180);
  drawGlow(ctx, getGlowColor(state));
  drawLeaves(ctx, leaves, state);
  drawSparkles(ctx, sparkles, state);
}
