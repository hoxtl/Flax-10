/**
 * Landing page root component.
 */

import React from "react";
import styles from "./landing-page.module.css";
import LandingPageContent from "./landing-page/LandingPageContent";
import { defaultGlobeConfig } from "./landing-page/landingPageConstants";
import { useLandingPageState } from "./landing-page/useLandingPageState";

function ScrollGlobe({ sections, className = "", globeConfig = defaultGlobeConfig }) {
  const landingPageState = useLandingPageState(sections, globeConfig);

  return (
    <LandingPageContent
      className={className}
      sections={sections}
      styles={styles}
      {...landingPageState}
    />
  );
}

export default ScrollGlobe;
