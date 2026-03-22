/**
 * Landing page scroll and animation state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildTransform,
  getGlobeOpacity,
  getInitialTransform,
  getInterpolatedPosition,
  getNearestSectionIndex,
  getScrollProgress,
  getScrollTop,
  getSectionInterpolation,
  getTargetIndex,
  getViewportCenter,
  lerp,
  parsePercent,
} from "./landingPageUtils";

export function useLandingPageState(sections, globeConfig) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayTransform, setDisplayTransform] = useState("");
  const refs = useLandingRefs();
  const calculatedPositions = useCalculatedPositions(globeConfig);
  const { getScrollableParent, globeOpacity, topPills } = useLandingPageMeta(activeSection, refs.containerRef, sections);
  const updateScrollPosition = useScrollPositionUpdater({ calculatedPositions, getScrollableParent, lastScrollTop: refs.lastScrollTop, sectionRefs: refs.sectionRefs, setActiveSection, setScrollProgress, targetTransformRef: refs.targetTransformRef });

  useInitialTransform(calculatedPositions, refs.targetTransformRef, refs.smoothTransformRef, setDisplayTransform);
  useScrollAnimation(calculatedPositions, getScrollableParent, setDisplayTransform, refs.smoothTransformRef, refs.targetTransformRef, updateScrollPosition, refs.animationFrameId, refs.animationTickerRef);
  return buildLandingPageState(activeSection, displayTransform, globeOpacity, refs.containerRef, refs.sectionRefs, scrollProgress, topPills);
}

function useLandingRefs() {
  return {
    animationFrameId: useRef(null),
    animationTickerRef: useRef(null),
    containerRef: useRef(null),
    lastScrollTop: useRef(0),
    sectionRefs: useRef([]),
    smoothTransformRef: useRef({ left: 0, top: 0, scale: 1 }),
    targetTransformRef: useRef({ left: 0, top: 0, scale: 1 }),
  };
}

function buildLandingPageState(activeSection, displayTransform, globeOpacity, containerRef, sectionRefs, scrollProgress, topPills) {
  return { activeSection, containerRef, displayTransform, globeOpacity, scrollProgress, sectionRefs, topPills };
}

function useLandingPageMeta(activeSection, containerRef, sections) {
  const getScrollableParent = useCallback(() => containerRef.current || window, [containerRef]);
  const globeOpacity = getGlobeOpacity(activeSection, sections.length);
  const topPills = sections?.[0]?.pills || [];

  return { getScrollableParent, globeOpacity, topPills };
}

function useCalculatedPositions(globeConfig) {
  return useMemo(() => {
    const positions = globeConfig.positions || [];
    return positions.map(normalizePosition);
  }, [globeConfig.positions]);
}

function normalizePosition(position) {
  return {
    top: parsePercent(position.top),
    left: parsePercent(position.left),
    scale: position.scale || 1,
  };
}

function useScrollPositionUpdater(config) {
  const {
    calculatedPositions,
    getScrollableParent,
    lastScrollTop,
    sectionRefs,
    setActiveSection,
    setScrollProgress,
    targetTransformRef,
  } = config;

  return useCallback(() => {
    const snapshot = getScrollSnapshot(config);
    applyScrollSnapshot(config, snapshot);
  }, [calculatedPositions, getScrollableParent, lastScrollTop, sectionRefs, setActiveSection, setScrollProgress, targetTransformRef]);
}

function getScrollSnapshot(config) {
  const scrollTarget = config.getScrollableParent();
  const scrollTop = getScrollTop(scrollTarget);
  const nearestIndex = getNearestSectionIndex(config.sectionRefs.current, getViewportCenter(scrollTarget));
  const currentIndex = clampIndex(nearestIndex, config.calculatedPositions.length - 1);
  const nextIndex = getTargetIndex(currentIndex, config.sectionRefs.current.length, isScrollingDown(scrollTop, config.lastScrollTop));

  return { currentIndex, nearestIndex, nextIndex, scrollTarget, scrollTop };
}

function applyScrollSnapshot(config, snapshot) {
  config.lastScrollTop.current = snapshot.scrollTop;
  config.setScrollProgress(getScrollProgress(snapshot.scrollTop, snapshot.scrollTarget));
  config.setActiveSection(snapshot.nearestIndex);
  config.targetTransformRef.current = getCurrentPosition(
    config.calculatedPositions,
    snapshot.currentIndex,
    snapshot.nextIndex,
    snapshot.scrollTop,
    config.sectionRefs.current,
  );
}

function clampIndex(index, maxIndex) {
  return Math.min(Math.max(index, 0), maxIndex);
}

function isScrollingDown(scrollTop, lastScrollTop) {
  return scrollTop >= lastScrollTop.current;
}

function getCurrentPosition(positions, currentIndex, nextIndex, scrollTop, sectionRefs) {
  const fromPosition = positions[currentIndex % positions.length];
  const toPosition = positions[nextIndex % positions.length];
  const interpolation = getSectionInterpolation(sectionRefs[currentIndex], sectionRefs[nextIndex], scrollTop, nextIndex >= currentIndex);

  return getInterpolatedPosition(fromPosition, toPosition, interpolation);
}

function useInitialTransform(positions, targetTransformRef, smoothTransformRef, setDisplayTransform) {
  useEffect(() => {
    if (!positions.length) {
      return;
    }

    const initial = getInitialTransform(positions[0]);
    targetTransformRef.current = initial;
    smoothTransformRef.current = initial;
    setDisplayTransform(buildTransform(initial));
  }, [positions, setDisplayTransform, smoothTransformRef, targetTransformRef]);
}

function useScrollAnimation(positions, getScrollableParent, setDisplayTransform, smoothTransformRef, targetTransformRef, updateScrollPosition, animationFrameId, animationTickerRef) {
  useEffect(() => {
    if (!positions.length) {
      return undefined;
    }

    const scrollTarget = getScrollableParent();
    const cleanup = registerScrollListener(scrollTarget, updateScrollPosition, animationFrameId);

    animationTickerRef.current = requestAnimationFrame(function animate() {
      updateSmoothTransform(setDisplayTransform, smoothTransformRef, targetTransformRef);
      animationTickerRef.current = requestAnimationFrame(animate);
    });

    updateScrollPosition();
    return () => cleanupScrollAnimation(cleanup, animationFrameId, animationTickerRef);
  }, [animationFrameId, animationTickerRef, getScrollableParent, positions, setDisplayTransform, smoothTransformRef, targetTransformRef, updateScrollPosition]);
}

function registerScrollListener(scrollTarget, updateScrollPosition, animationFrameId) {
  let ticking = false;

  const handleScroll = () => {
    if (ticking) {
      return;
    }

    animationFrameId.current = requestAnimationFrame(() => {
      updateScrollPosition();
      ticking = false;
    });
    ticking = true;
  };

  scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
  return () => scrollTarget.removeEventListener("scroll", handleScroll);
}

function updateSmoothTransform(setDisplayTransform, smoothTransformRef, targetTransformRef) {
  const ease = 0.1;
  const current = smoothTransformRef.current;
  const target = targetTransformRef.current;

  current.left = snapValue(lerp(current.left, target.left, ease), target.left, 0.02);
  current.top = snapValue(lerp(current.top, target.top, ease), target.top, 0.02);
  current.scale = snapValue(lerp(current.scale, target.scale, ease), target.scale, 0.002);
  setDisplayTransform(buildTransform(current));
}

function snapValue(value, target, threshold) {
  return Math.abs(value - target) < threshold ? target : value;
}

function cleanupScrollAnimation(cleanup, animationFrameId, animationTickerRef) {
  cleanup();
  cancelFrame(animationFrameId.current);
  cancelFrame(animationTickerRef.current);
}

function cancelFrame(frameId) {
  if (frameId) {
    cancelAnimationFrame(frameId);
  }
}
