/*
 * Memoized landing section data for the auth page.
 */

import { useMemo } from "react";
import styles from "../AuthenticationPage.module.css";
import { buildAuthLandingSections } from "../content/authenticationLandingSections";

export function useAuthLandingSections(state, actions) {
  return useMemo(
    () => buildAuthLandingSections(state, styles, actions),
    [actions, state],
  );
}
