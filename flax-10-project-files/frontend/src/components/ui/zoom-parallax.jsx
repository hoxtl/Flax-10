/**
 * ZoomParallaxTimeline — scroll-driven zoom bridge between Bento and Full-Day Timeline.
 * Progress starts when the container enters the viewport from below (i.e. user reaches
 * the IntelligenceRow footer) and completes when the container top reaches the scroll area top.
 * Timeline scales 0.78 → 1, width constrained → 100%, radius 20px → 0.
 */

import { useRef, useEffect } from "react";
import { useMotionValue, useTransform, motion } from "framer-motion";

export function ZoomParallaxTimeline({ children, onProgress, className = "", id }) {
  const containerRef = useRef(null);
  const progress = useMotionValue(0);

  useEffect(() => {
    const scrollEl = document.querySelector("[data-dashboard-main]");
    if (!scrollEl) return;

    const update = () => {
      const container = containerRef.current;
      if (!container) return;
      const scrollElRect = scrollEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // p = 0: container bottom just entered viewport (user at IntelligenceRow)
      // p = 1: container top reaches viewport top (fully zoomed in, sticky locks)
      const scrollable = scrollElRect.height;
      const scrolled = scrollElRect.bottom - containerRect.top;
      const p = scrollable > 0 ? Math.max(0, Math.min(1, scrolled / scrollable)) : 0;
      progress.set(p);
      onProgress?.(p);
    };

    scrollEl.addEventListener("scroll", update, { passive: true });
    update();
    return () => scrollEl.removeEventListener("scroll", update);
  }, [onProgress, progress]);

  const scale = useTransform(progress, [0, 0.5, 1], [0.78, 0.92, 1]);
  const width = useTransform(progress, [0, 1], ["min(860px, 92%)", "100%"]);
  const borderRadius = useTransform(progress, [0, 1], [20, 0]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{ position: "relative", height: "200vh" }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            scale,
            width,
            borderRadius,
            maxWidth: "100%",
            willChange: "transform",
            boxSizing: "border-box",
          }}
          className="zoom-parallax-timeline-inner"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
