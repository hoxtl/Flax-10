/*
 * Markdown rendering components for study coach replies.
 */

import styles from "./studyCoachStyles";

export const STUDY_COACH_MARKDOWN = {
  h1: ({ children }) => <h1 className={styles.mdH1}>{children}</h1>,
  h2: ({ children }) => <h2 className={styles.mdH2}>{children}</h2>,
  h3: ({ children }) => <h3 className={styles.mdH3}>{children}</h3>,
  p: ({ children }) => <p className={styles.mdP}>{children}</p>,
  li: ({ children }) => <li className={styles.mdLi}>{children}</li>,
  ul: ({ children }) => <ul className={styles.mdUl}>{children}</ul>,
  ol: ({ children }) => <ol className={styles.mdOl}>{children}</ol>,
  strong: ({ children }) => <strong className={styles.mdStrong}>{children}</strong>,
};
