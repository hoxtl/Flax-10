/*
 * Combined admin CSS module exports.
 */

import shellStyles from "./AdminPage.module.css";
import listStyles from "./AdminPageLists.module.css";
import detailStyles from "./AdminPageDetails.module.css";

const styles = {
  ...shellStyles,
  ...listStyles,
  ...detailStyles,
};

export default styles;
