/*
 * Sliding auth overlay actions.
 */

import styled from "styled-components";
import * as Components from "../utils/AuthComponents";

const OverlayTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-white-96);
  margin: 0;
  letter-spacing: -0.2px;
  text-align: center;
  line-height: 1.3;
`;

function LeftPanel({ signIn, onToggle }) {
  return (
    <Components.LeftOverlayPanel $signIn={signIn}>
      <OverlayTitle>Already have an account?</OverlayTitle>
      <Components.GhostButton onClick={() => onToggle(true)}>
        Sign In
      </Components.GhostButton>
    </Components.LeftOverlayPanel>
  );
}

function RightPanel({ signIn, onToggle }) {
  return (
    <Components.RightOverlayPanel $signIn={signIn}>
      <OverlayTitle>Join StudyFlax</OverlayTitle>
      <Components.GhostButton onClick={() => onToggle(false)}>
        Sign Up
      </Components.GhostButton>
    </Components.RightOverlayPanel>
  );
}

export function AuthOverlay({ signIn, onToggle }) {
  return (
    <Components.OverlayContainer $signIn={signIn}>
      <Components.Overlay $signIn={signIn}>
        <LeftPanel signIn={signIn} onToggle={onToggle} />
        <RightPanel signIn={signIn} onToggle={onToggle} />
      </Components.Overlay>
    </Components.OverlayContainer>
  );
}
