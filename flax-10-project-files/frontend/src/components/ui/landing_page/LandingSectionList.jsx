/**
 * Landing page section list.
 */

import React from "react";
import LandingSection from "./LandingSection";

function LandingSectionList(props) {
  const { sections } = props;

  return (
    <main>
      {sections.map(renderSection(props))}
    </main>
  );
}

function renderSection(props) {
  return function sectionItem(section, index) {
    return <LandingSection key={section.id} index={index} section={section} {...props} />;
  };
}

export default LandingSectionList;
