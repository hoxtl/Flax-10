/*
 * Combined admin CSS module exports.
 */

import shellStyles from "./AdminPage.module.css";
import heroStyles from "./AdminHero.module.css";
import listStyles from "./AdminPageLists.module.css";
import detailStyles from "./AdminPageDetails.module.css";

const styles = {
  ...shellStyles,
  ...heroStyles,
  ...listStyles,
  ...detailStyles,
};

export default styles;
