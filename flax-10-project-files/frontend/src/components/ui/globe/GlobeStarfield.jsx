/**
 * Globe starfield decoration.
 */

import { stars } from "./globeData";

export function GlobeStarfield() {
  return stars.map((star, index) => <GlobeStar key={index} {...star} />);
}

function GlobeStar({ animation, className }) {
  return <div className={className} style={{ animation }} />;
}
