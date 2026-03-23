/*
 * Productivity analytics cards.
 */

import styles from "./SummaryCards.module.css";

import ProductivityCard from "./ProductivityCard";
import { buildCardsConfig } from "./productivityCardData";

export default function ProductivityCards({ data, progressData }) {
  if (!data?.summary) return null;
  const cards = buildCardsConfig(data.summary, progressData?.summary);
  return <div className={`${styles.grid} ${styles.productivityGrid}`}>{cards.map((card) => <ProductivityCard key={card.label} {...card} />)}</div>;
}
