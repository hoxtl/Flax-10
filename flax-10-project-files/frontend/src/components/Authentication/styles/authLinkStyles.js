/*
 * Link and mobile toggle styles for authentication screens.
 */

import styled from "styled-components";
import { Link } from "react-router-dom";

export const Anchor = styled.a`
  color: #9e7e5d;
  font-size: 13px;
  text-decoration: none;

  &:hover {
    color: #4a3421;
    text-decoration: underline;
  }
`;

export const PasswordResetLink = styled(Link)`
  color: rgba(158, 126, 93, 0.9);
  text-decoration: none;
  font-size: 13px;
  align-self: center;
  transition: color 0.15s ease;

  &:hover {
    color: #4a3421;
    text-decoration: underline;
  }

  [data-mode="dark"] & {
    color: rgba(220, 190, 155, 0.85);

    &:hover {
      color: rgba(240, 215, 185, 1);
    }
  }
`;

export const MobileToggleButton = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    margin-top: 20px;
    font-size: 14px;
    color: rgba(43, 30, 20, 0.6);

    span {
      padding: 5px;
      color: #9e7e5d;
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
    }
  }
`;
