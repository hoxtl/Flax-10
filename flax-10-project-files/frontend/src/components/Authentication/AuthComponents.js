// src/components/Authentication/AuthComponents.js
import styled from "styled-components";
import { Link } from "react-router-dom";

export const Container = styled.div`
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 14px 28px rgba(74, 52, 33, 0.18), 0 10px 10px rgba(74, 52, 33, 0.12);
  position: relative;
  overflow: hidden;
  width: 850px;
  max-width: 100%;
  min-height: 650px;
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
  padding: 0 50px;
  height: 100%;
  text-align: center;
`;

export const Title = styled.h1`
  font-weight: bold;
  margin: 0;
  font-size: 45px;
  text-align: center;
  padding-left: 20px;
`;

export const Input = styled.input`
  background-color: #f0ede8;
  border: 1px solid rgba(74, 52, 33, 0.18);
  padding: 12px 15px;
  margin: 8px 0;
  width: 100%;
  border-radius: 4px;
  color: #2b1e14;

  &:focus {
    outline: none;
    border-color: #9e7e5d;
    background-color: #ffffff;
  }

  &::placeholder {
    color: rgba(43, 30, 20, 0.55);
  }
`;

export const Button = styled.button`
  position: relative;
  border-radius: 999px;
  border: 1px solid rgba(74, 52, 33, 0.38);
  background: linear-gradient(180deg, rgba(84, 60, 39, 0.98), rgba(60, 41, 26, 0.98));
  color: rgba(255, 255, 255, 0.96);
  font-size: 12px;
  font-weight: 650;
  padding: 12px 45px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
  overflow: hidden;
  will-change: transform;
  box-shadow: 0 10px 28px rgba(74, 52, 33, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.35);

  &::before {
    content: "";
    position: absolute;
    inset: -45% -70%;
    background: linear-gradient(
      120deg,
      transparent 35%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 65%
    );
    transform: translateX(-60%) rotate(8deg);
    opacity: 0;
    pointer-events: none;
    box-shadow: 0 20px 50px rgba(74, 52, 33, 0.28);
  }

  &:hover:not(:disabled)::before {
    opacity: 1;
    animation: btnSheen 1.15s ease forwards;
  }

  @keyframes btnSheen {
    to {
      transform: translateX(60%) rotate(8deg);
    }
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.01);
    background: transparent;
    color: rgba(74, 52, 33, 0.92);
    border-color: rgba(74, 52, 33, 0.92);
    box-shadow: 0 18px 42px rgba(74, 52, 33, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.45);
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

  &:disabled::before {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none !important;
      transition: none !important;
    }
    transition: none !important;
  }
`;

export const GhostButton = styled(Button)`
  background: rgba(255, 255, 255, 0.66);
  border-color: rgba(74, 52, 33, 0.14);
  color: rgba(43, 30, 20, 0.92);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(74, 52, 33, 0.18);
  }
`;

export const Anchor = styled.a`
  color: #9e7e5d;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;

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
  background: linear-gradient(135deg, #9e7e5d 0%, #81725b 50%, #4a3421 100%);
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
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
  color: #ffffff;
  max-width: 280px;
`;

export const PasswordResetLink = styled(Link)`
  color: #9e7e5d;
  text-decoration: none;
  font-size: 0.9rem;
  align-self: center;
  margin-top: 0.5rem;
  transition: all 0.1s ease-in-out;

  &:hover {
    color: #4a3421;
    text-decoration: underline;
  }
`;