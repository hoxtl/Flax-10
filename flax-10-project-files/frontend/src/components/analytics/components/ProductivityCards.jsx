/*
 * Productivity analytics cards.
 */

import styles from "../styles/SummaryCards.module.css";

import ProductivityCard from "./ProductivityCard";
import { buildCardsConfig } from "../utils/productivityCardData";

export default function ProductivityCards({ balanced = false, data, progressData }) {
  if (!data?.summary) return null;
  const cards = buildCardsConfig(data.summary, progressData?.summary);
  return <div className={`${styles.grid} ${styles.productivityGrid} ${balanced ? styles.productivityGridBalanced : ""}`.trim()}>{cards.map((card) => <ProductivityCard key={card.label} {...card} />)}</div>;
}
