/*
 * Overlay panel styles for authentication screens.
 */

import styled from "styled-components";
import { Button } from "./authCardStyles";

export const GhostButton = styled(Button)`
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.55);
  color: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.28);
    border-color: rgba(255, 255, 255, 0.75);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
  background: linear-gradient(150deg, #7a6148 0%, #5c4530 40%, #3c2a1a 100%);
  background-repeat: no-repeat;
  background-size: cover;
  color: #ffffff;
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
      rgba(255, 255, 255, 0.06) 0%,
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
  color: rgba(255, 255, 255, 0.8);
  max-width: 240px;
`;
