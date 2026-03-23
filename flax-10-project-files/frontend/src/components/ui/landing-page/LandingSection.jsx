/**
 * Landing page section.
 */

import React from "react";
import { PrimaryButton } from "../../common";
import { cx } from "./landingPageUtils";

function LandingSection(props) {
  const { activeSection, index, section, sectionRefs, sections, styles } = props;
  const sectionClassName = getSectionClassName(activeSection, index, section, sections, styles);
  const style = getSectionStyle(index);

  return (
    <section id={section.id} ref={assignSectionRef(sectionRefs, index)} className={sectionClassName} style={style}>
      <div className={styles.sectionInner}>
        <LandingSectionHeader section={section} styles={styles} />
        <LandingSectionDescription section={section} styles={styles} />
        <LandingSectionFeatures section={section} styles={styles} />
        <LandingSectionContent section={section} styles={styles} />
        <LandingSectionActions section={section} styles={styles} />
      </div>
    </section>
  );
}

function getSectionClassName(activeSection, index, section, sections, styles) {
  return cx(
    styles.section,
    index === 0 && styles.sectionFirst,
    index === sections.length - 1 && styles.sectionLast,
    section.align === "center" && styles.sectionCenter,
    section.align === "right" && styles.sectionRight,
    index % 2 === 1 && styles.sectionAlternate,
    activeSection === index ? styles.sectionActive : styles.sectionInactive,
  );
}

function getSectionStyle(index) {
  return {
    "--section-delay": `${index * 0.08}s`,
    "--section-shift": index % 2 === 1 ? "10px" : "-10px",
  };
}

function assignSectionRef(sectionRefs, index) {
  return function setSectionRef(element) {
    sectionRefs.current[index] = element;
  };
}

function LandingSectionHeader({ section, styles }) {
  return (
    <h1 className={styles.title}>
      {section.subtitle ? <TitleGroup section={section} styles={styles} /> : <span className={styles.titleMain}>{section.title}</span>}
    </h1>
  );
}

function TitleGroup({ section, styles }) {
  return (
    <div className={styles.titleGroup}>
      <span className={styles.titleMain}>{section.title}</span>
      <span className={styles.titleSub}>{section.subtitle}</span>
    </div>
  );
}

function LandingSectionDescription({ section, styles }) {
  return <p className={styles.description}>{section.description}</p>;
}

function LandingSectionFeatures({ section, styles }) {
  if (!section.features?.length) {
    return null;
  }

  return <div className={styles.featureGrid}>{section.features.map(renderFeature(styles))}</div>;
}

function renderFeature(styles) {
  return function featureItem(feature) {
    return (
      <article key={feature.title} className={styles.featureCard}>
        <span className={styles.featureBullet} />
        <div>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          <p className={styles.featureText}>{feature.description}</p>
        </div>
      </article>
    );
  };
}

function LandingSectionContent({ section, styles }) {
  if (!section.content) {
    return null;
  }

  return <div className={styles.sectionContent}>{section.content}</div>;
}

function LandingSectionActions({ section, styles }) {
  if (!section.actions?.length) {
    return null;
  }

  return <div className={styles.actionRow}>{section.actions.map(renderAction(styles))}</div>;
}

function renderAction(styles) {
  return function actionItem(action) {
    return (
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
    );
  };
}

export default LandingSection;
