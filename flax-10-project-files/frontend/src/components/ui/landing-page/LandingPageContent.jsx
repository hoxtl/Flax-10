/**
 * Landing page layout composition.
 */

import React from "react";
import Globe from "../globe";
import { cx } from "./landingPageUtils";
import LandingGlobe from "./LandingGlobe";
import LandingProgress from "./LandingProgress";
import LandingSectionList from "./LandingSectionList";
import LandingSectionNav from "./LandingSectionNav";
import LandingTopPills from "./LandingTopPills";

function LandingPageContent(props) {
  const { className, containerRef, sections, styles } = props;

  return (
    <div className={cx(styles.wrapper, className)} ref={containerRef}>
      <LandingProgress {...props} />
      <LandingTopPills {...props} />
      <LandingSectionNav {...props} />
      <LandingGlobe {...props}>
        <Globe />
      </LandingGlobe>
      <LandingSectionList sections={sections} styles={styles} {...props} />
    </div>
  );
}

export default LandingPageContent;
