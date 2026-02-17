// src/components/Authentication/AuthComponents.js
import styled from "styled-components";
import { Link } from "react-router-dom";

export const Container = styled.div`
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(74, 52, 33, 0.18), 0 8px 24px rgba(74, 52, 33, 0.10);
  position: relative;
  overflow: hidden;
  width: 960px;
  max-width: 100%;
  min-height: 620px;
`;

export const SignUpContainer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;

  ${(props) =>
    props.$signIn !== true
      ? `
    transform: translateX(100%);
    opacity: 1;
    z-index: 5;
  `
      : ""}
`;

export const SignInContainer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
  left: 0;
  width: 50%;
  z-index: 2;

  ${(props) => (props.$signIn !== true ? `transform: translateX(100%);` : "")}
`;

export const Form = styled.form`
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 44px 56px;
  height: 100%;
  text-align: center;
  gap: 4px;
  box-sizing: border-box;
`;

export const Title = styled.h1`
  font-weight: 700;
  margin: 0 0 24px 0;
  font-size: 30px;
  text-align: center;
  color: #2b1e14;
  letter-spacing: -0.3px;
`;

export const Input = styled.input`
  background-color: #f7f5f2;
  border: 1.5px solid rgba(74, 52, 33, 0.12);
  padding: 14px 18px;
  margin: 6px 0;
  width: 100%;
  border-radius: 8px;
  color: #2b1e14;
  font-size: 14px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #9e7e5d;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(158, 126, 93, 0.12);
  }

  &::placeholder {
    color: rgba(43, 30, 20, 0.42);
  }
`;

export const Button = styled.button`
  position: relative;
  border-radius: 999px;
  border: 1.5px solid rgba(74, 52, 33, 0.4);
  background: linear-gradient(180deg, #5c3f28 0%, #3c2a1a 100%);
  color: rgba(255, 255, 255, 0.96);
  font-size: 11px;
  font-weight: 700;
  padding: 14px 48px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
  overflow: hidden;
  will-change: transform;
  box-shadow: 0 8px 24px rgba(74, 52, 33, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  margin-top: 10px;

  &::before {
    content: "";
    position: absolute;
    inset: -45% -70%;
    background: linear-gradient(
      120deg,
      transparent 35%,
      rgba(255, 255, 255, 0.28) 50%,
      transparent 65%
    );
    transform: translateX(-60%) rotate(8deg);
    opacity: 0;
    pointer-events: none;
  }

  &:hover:not(:disabled)::before {
    opacity: 1;
    animation: btnSheen 1.15s ease forwards;
  }

  @keyframes btnSheen {
    to { transform: translateX(60%) rotate(8deg); }
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 14px 36px rgba(74, 52, 33, 0.28);
  }

  &:active:not(:disabled) {
    transform: translateY(0px) scale(0.99);
  }

  &:focus {
    outline: 2px solid rgba(74, 52, 33, 0.28);
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before { animation: none !important; }
    transition: none !important;
  }
`;

export const GhostButton = styled(Button)`
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.55);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.28);
    border-color: rgba(255, 255, 255, 0.75);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`;

export const Anchor = styled.a`
  color: #9e7e5d;
  font-size: 13px;
  text-decoration: none;
  margin: 12px 0;

  &:hover {
    color: #4a3421;
    text-decoration: underline;
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

  ${(props) => (props.$signIn !== true ? `transform: translateX(-100%);` : "")}
`;

export const Overlay = styled.div`
  background: linear-gradient(150deg, #7a6148 0%, #5c4530 40%, #3c2a1a 100%);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 0 0;
  color: #ffffff;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.06) 0%, transparent 60%);
    pointer-events: none;
  }

  ${(props) => (props.$signIn !== true ? `transform: translateX(50%);` : "")}
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

  ${(props) => (props.$signIn !== true ? `transform: translateX(20%);` : "")}
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

export const PasswordResetLink = styled(Link)`
  color: rgba(158, 126, 93, 0.9);
  text-decoration: none;
  font-size: 13px;
  align-self: center;
  margin: 6px 0 2px;
  transition: color 0.15s ease;

  &:hover {
    color: #4a3421;
    text-decoration: underline;
  }
`;