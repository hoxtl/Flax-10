/**
 * Landing page root component.
 */

import React from "react";
import styles from "./LandingPage.module.css";
import LandingPageContent from "./landing_page/LandingPageContent";
import { defaultGlobeConfig } from "./landing_page/landingPageConstants";
import { useLandingPageState } from "./landing_page/useLandingPageState";

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
