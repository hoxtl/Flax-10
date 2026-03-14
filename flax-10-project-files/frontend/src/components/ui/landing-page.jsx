import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "./globe";
import styles from "./landing-page.module.css";
import { PrimaryButton } from "../common";

const lerp = (start, end, factor) => start + (end - start) * factor;
const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },
    { top: "25%", left: "50%", scale: 0.9 },
    { top: "15%", left: "90%", scale: 2 },
    { top: "50%", left: "50%", scale: 1.8 },
  ],
};

const cx = (...classes) => classes.filter(Boolean).join(" ");
const parsePercent = (value) => Number.parseFloat(value);

function ScrollGlobe({
  sections,
  className = "",
  globeConfig = defaultGlobeConfig,
}) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayTransform, setDisplayTransform] = useState("");

  const sectionRefs = useRef([]);
  const containerRef = useRef(null);
  const animationFrameId = useRef(null);
  const lastScrollTop = useRef(0);
  const animationTickerRef = useRef(null);
  const targetTransformRef = useRef({ left: 0, top: 0, scale: 1 });
  const smoothTransformRef = useRef({ left: 0, top: 0, scale: 1 });

  const calculatedPositions = useMemo(() => {
    return (globeConfig.positions || []).map((position) => ({
      top: parsePercent(position.top),
      left: parsePercent(position.left),
      scale: position.scale || 1,
    }));
  }, [globeConfig.positions]);
  const topPills = sections?.[0]?.pills || [];

  const getScrollableParent = useCallback(() => containerRef.current || window, []);

  const updateScrollPosition = useCallback(() => {
    const scrollTarget = getScrollableParent();
    const scrollTop = scrollTarget === window
      ? (window.pageYOffset || document.documentElement.scrollTop || 0)
      : scrollTarget.scrollTop;
    const docHeight = Math.max(
      scrollTarget === window
        ? document.documentElement.scrollHeight - window.innerHeight
        : scrollTarget.scrollHeight - scrollTarget.clientHeight,
      1,
    );
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
    setScrollProgress(progress);

    const scrollWindowHeight = scrollTarget === window ? window.innerHeight : scrollTarget.clientHeight;
    const viewportCenter = scrollWindowHeight / 2;
    let newActiveSection = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = Math.abs(sectionCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        newActiveSection = index;
      }
    });

    const currentIndex = Math.min(
      Math.max(newActiveSection, 0),
      calculatedPositions.length - 1,
    );
    const scrollY = scrollTarget === window
      ? (window.pageYOffset || document.documentElement.scrollTop || 0)
      : scrollTarget.scrollTop;
    const isScrollingDown = scrollY >= lastScrollTop.current;
    lastScrollTop.current = scrollY;

    const hasNext = currentIndex < sectionRefs.current.length - 1;
    const hasPrev = currentIndex > 0;
    const nextOrPrevIndex = isScrollingDown && hasNext
      ? currentIndex + 1
      : !isScrollingDown && hasPrev
        ? currentIndex - 1
        : currentIndex;

    const fromPos = calculatedPositions[currentIndex % calculatedPositions.length];
    const toPos =
      calculatedPositions[nextOrPrevIndex % calculatedPositions.length];

    const currentRef = sectionRefs.current[currentIndex];
    const targetRef = sectionRefs.current[nextOrPrevIndex];
    let interpolation = 0;

    if (currentRef && targetRef && currentRef !== targetRef && currentRef.offsetTop !== undefined) {
      const span = targetRef.offsetTop - currentRef.offsetTop;
      if (span !== 0) {
        interpolation = Math.min(
          Math.max((scrollY - currentRef.offsetTop) / span, 0),
          1,
        );
        if (!isScrollingDown) interpolation = 1 - interpolation;
      }
    }

    const currentPos = {
      left: lerp(fromPos.left, toPos.left, interpolation),
      top: lerp(fromPos.top, toPos.top, interpolation),
      scale: lerp(fromPos.scale, toPos.scale, interpolation),
    };

    targetTransformRef.current = currentPos;
    setActiveSection(newActiveSection);
  }, [calculatedPositions, getScrollableParent]);

  useEffect(() => {
    if (!calculatedPositions.length) return;
    const scrollTarget = getScrollableParent();
    const initial = calculatedPositions[0];
    targetTransformRef.current = {
      left: initial.left,
      top: initial.top,
      scale: initial.scale,
    };
    smoothTransformRef.current = {
      left: initial.left,
      top: initial.top,
      scale: initial.scale,
    };
    setDisplayTransform(
      `translate3d(${initial.left}vw, ${initial.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initial.scale}, ${initial.scale}, 1)`,
    );

    const animate = () => {
      const target = targetTransformRef.current;
      const current = smoothTransformRef.current;
      const ease = 0.16;
      current.left = lerp(current.left, target.left, ease);
      current.top = lerp(current.top, target.top, ease);
      current.scale = lerp(current.scale, target.scale, ease);
      const nextTransform = `translate3d(${current.left}vw, ${current.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${current.scale}, ${current.scale}, 1)`;
      setDisplayTransform(nextTransform);
      animationTickerRef.current = requestAnimationFrame(animate);
    };
    animationTickerRef.current = requestAnimationFrame(animate);

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (animationTickerRef.current) cancelAnimationFrame(animationTickerRef.current);
    };
  }, [getScrollableParent, calculatedPositions, updateScrollPosition]);

  useEffect(() => {
    if (!calculatedPositions.length) return;
    const initial = calculatedPositions[0];
    targetTransformRef.current = {
      left: initial.left,
      top: initial.top,
      scale: initial.scale,
    };
    smoothTransformRef.current = {
      left: initial.left,
      top: initial.top,
      scale: initial.scale,
    };
    const initialTransform = `translate3d(${initial.left}vw, ${initial.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initial.scale}, ${initial.scale}, 1)`;
    setDisplayTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div className={cx(styles.wrapper, className)} ref={containerRef}>
      <div className={styles.progressWrap} aria-hidden>
        <div
          className={styles.progressBar}
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      </div>
      {topPills.length ? (
        <div className={styles.pageTopPills} aria-label="Key features">
          <p className={styles.pageTopText}>
            {topPills.map((pill, index) => (
              <span key={pill} className={styles.pageTopItem}>
                {index > 0 ? " \u00b7 " : ""}
                {pill}
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <nav className={styles.sectionNav} aria-label="Landing page sections">
        <div className={styles.navStack}>
          {sections.map((section, index) => (
            <div key={section.id} className={styles.navItem}>
              <div
                className={cx(
                  styles.navLabel,
                  activeSection === index && styles.navLabelActive,
                )}
              >
                <span className={styles.navDot} />
                {section.badge || `Section ${index + 1}`}
              </div>
              <button
                type="button"
                onClick={() =>
                  sectionRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className={cx(
                  styles.navButton,
                  activeSection === index ? styles.navButtonActive : "",
                )}
                aria-label={`Go to ${section.title}`}
              />
            </div>
          ))}
        </div>
        <div className={styles.navLine} />
      </nav>

      <div
        className={styles.globeWrap}
        style={{
          transform: displayTransform,
          opacity: activeSection === sections.length - 1 ? 0.38 : 0.85,
        }}
      >
        <div className={styles.globeInner}>
          <Globe />
        </div>
      </div>

      <main>
        {sections.map((section, index) => {
          const isAlternate = index % 2 === 1;
          const isActiveSection = activeSection === index;
          return (
          <section
            id={section.id}
            key={section.id}
            ref={(element) => {
              sectionRefs.current[index] = element;
            }}
            className={cx(
              styles.section,
              index === 0 ? styles.sectionFirst : "",
              section.align === "center" ? styles.sectionCenter : "",
              section.align === "right" ? styles.sectionRight : "",
              isAlternate ? styles.sectionAlternate : "",
              isActiveSection ? styles.sectionActive : styles.sectionInactive,
            )}
            style={
              {
                "--section-delay": `${index * 0.08}s`,
                "--section-shift": isAlternate ? "10px" : "-10px",
              }
            }
          >
            <div className={styles.sectionInner}>
              <h1 className={styles.title}>
                {section.subtitle ? (
                  <div className={styles.titleGroup}>
                    <span className={styles.titleMain}>{section.title}</span>
                    <span className={styles.titleSub}>{section.subtitle}</span>
                  </div>
                ) : (
                  <span className={styles.titleMain}>{section.title}</span>
                )}
              </h1>

              <p className={styles.description}>{section.description}</p>

              {section.features?.length ? (
                <div className={styles.featureGrid}>
                  {section.features.map((feature) => (
                    <article key={feature.title} className={styles.featureCard}>
                      <span className={styles.featureBullet} />
                      <div>
                        <h3 className={styles.featureTitle}>{feature.title}</h3>
                        <p className={styles.featureText}>{feature.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {section.content ? <div className={styles.sectionContent}>{section.content}</div> : null}
              {section.actions?.length ? (
                <div className={styles.actionRow}>
                  {section.actions.map((action) => (
                    <PrimaryButton
                      key={action.label}
                      type="button"
                      variant={action.variant === "secondary" ? "secondary" : "primary"}
                      size="large"
                      className={styles.actionButton}
                      onClick={action.onClick}
                    >
                      {action.label}
                    </PrimaryButton>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        )})}
      </main>
    </div>
  );
}

export default ScrollGlobe;
