/*
 * Overlay panel styles for authentication screens.
 */

import styled from "styled-components";
import { Button } from "./authCardStyles";

export const GhostButton = styled(Button)`
  background: var(--auth-ghost-bg);
  border-color: var(--auth-ghost-border);
  color: var(--auth-ghost-color);
  box-shadow:
    0 4px 16px var(--auth-ghost-shadow),
    inset 0 1px 0 var(--auth-ghost-inset);
  backdrop-filter: blur(8px);

  &:hover:not(:disabled) {
    background: var(--auth-ghost-hover-bg);
    border-color: var(--auth-ghost-hover-border);
    box-shadow: 0 8px 24px var(--auth-ghost-hover-shadow);
  }
`;

export const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
  ${({ $signIn }) => (!$signIn ? "transform: translateX(-100%);" : "")}

  @media (max-width: 768px) {
    display: none;
  }
`;

export const Overlay = styled.div`
  background: linear-gradient(150deg, var(--auth-overlay-bg-start) 0%, var(--auth-overlay-bg-mid) 40%, var(--auth-overlay-bg-end) 100%);
  background-repeat: no-repeat;
  background-size: cover;
  color: var(--auth-overlay-color);
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  ${({ $signIn }) => ($signIn !== true ? "transform: translateX(50%);" : "")}

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 70% 30%,
      var(--auth-overlay-glow) 0%,
      transparent 60%
    );
    pointer-events: none;
  }

  @media (max-width: 768px) {
    left: 0;
    top: -100%;
    width: 100%;
    height: 200%;
    ${({ $signIn }) =>
      $signIn !== true
        ? "transform: translateY(50%);"
        : "transform: translateY(0);"}
  }
`;

export const OverlayPanel = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 40px;
  text-align: center;
  top: 0;
  height: 100%;
  width: 50%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
  gap: 24px;
`;

export const LeftOverlayPanel = styled(OverlayPanel)`
  transform: translateX(-1%);
`;

export const RightOverlayPanel = styled(OverlayPanel)`
  right: 0;
  transform: translateX(1%);
  ${({ $signIn }) => ($signIn !== true ? "transform: translateX(20%);" : "")}
`;

export const Paragraph = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.3px;
  margin: 0;
  color: var(--auth-para-color);
  max-width: 240px;
`;
