/**
 * Landing page section navigation.
 */

import React from "react";
import { cx } from "./landingPageUtils";

function LandingSectionNav({ activeSection, sectionRefs, sections, styles }) {
  return (
    <nav className={styles.sectionNav} aria-label="Landing page sections">
      <div className={styles.navStack}>{sections.map(renderNavItem(activeSection, sectionRefs, styles))}</div>
      <div className={styles.navLine} />
    </nav>
  );
}

function renderNavItem(activeSection, sectionRefs, styles) {
  return function navItem(section, index) {
    return (
      <LandingNavItem
        activeSection={activeSection}
        index={index}
        section={section}
        sectionRefs={sectionRefs}
        styles={styles}
      />
    );
  };
}

function LandingNavItem({ activeSection, index, section, sectionRefs, styles }) {
  const isActive = activeSection === index;

  return (
    <div key={section.id} className={styles.navItem}>
      <div className={cx(styles.navLabel, isActive && styles.navLabelActive)}>
        <span className={styles.navDot} />
        {section.badge || `Section ${index + 1}`}
      </div>
      <button
        type="button"
        onClick={() => scrollToSection(sectionRefs, index)}
        className={cx(styles.navButton, isActive && styles.navButtonActive)}
        aria-label={`Go to ${section.title}`}
      />
    </div>
  );
}

function scrollToSection(sectionRefs, index) {
  sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default LandingSectionNav;
