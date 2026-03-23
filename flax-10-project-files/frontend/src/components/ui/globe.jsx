/**
 * Decorative globe component.
 */

import { GlobeStarfield } from "./globe/GlobeStarfield";
import { globeStyle, keyframes } from "./globe/globeData";

export default function Globe() {
  return (
    <>
      <style>{keyframes}</style>
      <div className="flex items-center justify-center h-screen">
        <div className="relative" style={globeStyle}>
          <GlobeStarfield />
        </div>
      </div>
    </>
  );
}
