/*
 * Core card and form styles for authentication screens.
 */

import styled from "styled-components";

export const Container = styled.div`
  background-color: var(--auth-card-bg, var(--panel));
  border-radius: 16px;
  box-shadow:
    0 20px 60px color-mix(in srgb, var(--primary) 18%, transparent),
    0 8px 24px color-mix(in srgb, var(--primary) 10%, transparent);
  position: relative;
  overflow: hidden;
  width: 860px;
  max-width: 100%;
  min-height: 460px;

  @media (max-width: 768px) {
    min-height: 520px;
    height: auto;
    width: 100%;
    margin: 0 16px;
  }
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
  ${({ $signIn }) =>
    !$signIn
      ? `
    transform: translateX(100%);
    opacity: 1;
    z-index: 5;
  `
      : ""}

  @media (max-width: 768px) {
    width: 100%;
    position: relative;
    transform: none;
    display: ${({ $signIn }) => ($signIn ? "none" : "block")};
    animation: ${({ $signIn }) =>
      !$signIn ? "fadeIn 0.5s ease-out forwards" : "none"};
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const SignInContainer = styled.div`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.6s ease-in-out;
  left: 0;
  width: 50%;
  z-index: 2;
  ${({ $signIn }) => (!$signIn ? "transform: translateX(100%);" : "")}

  @media (max-width: 768px) {
    width: 100%;
    position: relative;
    transform: none;
    display: ${({ $signIn }) => ($signIn ? "block" : "none")};
    animation: ${({ $signIn }) =>
      $signIn ? "fadeIn 0.5s ease-out forwards" : "none"};
  }
`;

export const Form = styled.form`
  background-color: var(--auth-form-bg, var(--panel));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 20px 38px;
  height: 100%;
  text-align: center;
  gap: 6px;
  box-sizing: border-box;
`;

export const Title = styled.h1`
  font-weight: 700;
  margin: 0 0 4px 0;
  font-size: 24px;
  text-align: center;
  color: var(--auth-title-fg, var(--text));
  letter-spacing: -0.3px;
`;

export const Input = styled.input`
  background-color: var(--auth-input-bg, var(--panel));
  border: 1.5px solid var(--auth-input-border, var(--border));
  padding: 7px 14px;
  width: 100%;
  border-radius: 8px;
  color: var(--auth-input-fg, var(--text));
  font-size: 14px;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--auth-input-focus-border, var(--primary));
    background-color: var(--auth-input-focus-bg, var(--panel));
    box-shadow: var(--auth-input-focus-ring, var(--focus-ring));
  }

  &::placeholder {
    color: var(--auth-input-placeholder, var(--muted));
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover {
    -webkit-text-fill-color: var(--auth-input-fg, var(--text));
    caret-color: var(--auth-input-fg, var(--text));
    -webkit-box-shadow: 0 0 0 1000px var(--auth-input-bg, var(--panel)) inset;
    box-shadow: 0 0 0 1000px var(--auth-input-bg, var(--panel)) inset;
    border: 1.5px solid var(--auth-input-border, var(--border));
    transition: background-color 9999s ease-out 0s;
  }

  &:-webkit-autofill:focus {
    -webkit-text-fill-color: var(--auth-input-fg, var(--text));
    -webkit-box-shadow: 0 0 0 1000px var(--auth-input-focus-bg, var(--panel))
      inset;
    box-shadow: 0 0 0 1000px var(--auth-input-focus-bg, var(--panel)) inset;
    border: 1.5px solid var(--auth-input-focus-border, var(--primary));
  }
`;

export const Button = styled.button`
  position: relative;
  border-radius: 999px;
  border: 1.5px solid var(--auth-btn-border);
  background: linear-gradient(180deg, var(--auth-btn-gradient-start) 0%, var(--auth-btn-gradient-end) 100%);
  color: var(--auth-btn-color);
  font-size: 11px;
  font-weight: 700;
  padding: 11px 34px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
  overflow: hidden;
  will-change: transform;
  box-shadow:
    0 8px 24px var(--auth-btn-shadow-warm),
    inset 0 1px 0 var(--auth-btn-inset);
  margin-top: 4px;

  &::before {
    content: "";
    position: absolute;
    inset: -45% -70%;
    background: linear-gradient(
      120deg,
      transparent 35%,
      var(--auth-btn-sheen) 50%,
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
    to {
      transform: translateX(60%) rotate(8deg);
    }
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 14px 36px var(--auth-btn-shadow-warm-hover);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
  }

  &:focus {
    outline: 2px solid var(--auth-btn-focus-outline);
    outline-offset: 3px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none !important;
    }

    transition: none !important;
  }
`;

export const FieldStack = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FieldRow = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
