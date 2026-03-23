/*
 * Link and mobile toggle styles for authentication screens.
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

export const Anchor = styled.a`
  color: var(--auth-link-color);
  font-size: 13px;
  text-decoration: none;

  &:hover {
    color: var(--auth-link-hover-color);
    text-decoration: underline;
  }
`;

export const PasswordResetLink = styled(Link)`
  color: var(--auth-link-alpha);
  text-decoration: none;
  font-size: 13px;
  align-self: center;
  transition: color 0.15s ease;

  &:hover {
    color: var(--auth-link-hover-color);
    text-decoration: underline;
  }

  [data-mode="dark"] & {
    color: var(--auth-link-dark);

    &:hover {
      color: var(--auth-link-dark-hover);
    }
  }
`;

export const MobileToggleButton = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    margin-top: 20px;
    font-size: 14px;
    color: var(--auth-mobile-text);

    span {
      padding: 5px;
      color: var(--auth-link-color);
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
    }
  }
`;
