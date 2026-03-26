/**
 * Landing page state helpers.
 */

export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function parsePercent(value) {
  return Number.parseFloat(value);
}

export function getScrollTop(scrollTarget) {
  if (scrollTarget === window) {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  return scrollTarget.scrollTop;
}

export function getDocumentHeight(scrollTarget) {
  if (scrollTarget === window) {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  return scrollTarget.scrollHeight - scrollTarget.clientHeight;
}

export function getViewportCenter(scrollTarget) {
  const height = scrollTarget === window
    ? window.innerHeight
    : scrollTarget.clientHeight;

  return height / 2;
}

export function getScrollProgress(scrollTop, scrollTarget) {
  const height = Math.max(getDocumentHeight(scrollTarget), 1);
  return Math.min(Math.max(scrollTop / height, 0), 1);
}

export function getNearestSectionIndex(sectionRefs, viewportCenter) {
  let activeIndex = 0;
  let minDistance = Number.POSITIVE_INFINITY;

  sectionRefs.forEach((ref, index) => {
    updateNearestSection(ref, index, viewportCenter, (distance) => {
      minDistance = distance;
      activeIndex = index;
    }, minDistance);
  });

  return activeIndex;
}

function updateNearestSection(ref, index, viewportCenter, setNearest, minDistance) {
  if (!ref) {
    return;
  }

  const rect = ref.getBoundingClientRect();
  const sectionCenter = rect.top + rect.height / 2;
  const distance = Math.abs(sectionCenter - viewportCenter);

  if (distance < minDistance) {
    setNearest(distance, index);
  }
}

export function getTargetIndex(currentIndex, total, isScrollingDown) {
  const hasNext = currentIndex < total - 1;
  const hasPrev = currentIndex > 0;

  if (isScrollingDown && hasNext) {
    return currentIndex + 1;
  }

  if (!isScrollingDown && hasPrev) {
    return currentIndex - 1;
  }

  return currentIndex;
}

export function getSectionInterpolation(currentRef, targetRef, scrollTop, isScrollingDown) {
  if (!currentRef || !targetRef || currentRef === targetRef) {
    return 0;
  }

  const span = targetRef.offsetTop - currentRef.offsetTop;

  if (span === 0) {
    return 0;
  }

  const progress = Math.min(Math.max((scrollTop - currentRef.offsetTop) / span, 0), 1);
  return isScrollingDown ? progress : 1 - progress;
}

export function buildTransform({ left, top, scale }) {
  return `translate3d(${left}vw, ${top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${scale}, ${scale}, 1)`;
}

export function getInitialTransform(position) {
  return {
    left: position.left,
    top: position.top,
    scale: position.scale,
  };
}

export function getInterpolatedPosition(fromPosition, toPosition, interpolation) {
  return {
    left: lerp(fromPosition.left, toPosition.left, interpolation),
    top: lerp(fromPosition.top, toPosition.top, interpolation),
    scale: lerp(fromPosition.scale, toPosition.scale, interpolation),
  };
}

export function getGlobeOpacity(activeSection, sectionCount) {
  return activeSection === sectionCount - 1 ? 0.38 : 0.85;
}
