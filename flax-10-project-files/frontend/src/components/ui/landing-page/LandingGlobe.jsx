/**
 * Landing page globe shell.
 */

import React from "react";

function LandingGlobe({ children, displayTransform, globeOpacity, styles }) {
  const globeWrapStyle = { opacity: globeOpacity, transform: displayTransform };
  return (
    <div className={styles.globeWrap} style={globeWrapStyle}>
      <div className={styles.globeInner}>{children}</div>
    </div>
  );
}

export default LandingGlobe;
