import { useRef } from "react";
import {
  useCarouselGestures,
  useCarouselKeyboard,
  useCarouselNavigation,
} from "../Society/hooks/useCarouselNavigation";
import styles from "./StudentStoryCarousel.module.css";

export default function StudentStoryCarousel({ items = [] }) {
  const carouselRef = useRef(null);
  const { index, prev, next } = useCarouselNavigation(Math.max(items.length, 0), 0);

  useCarouselGestures(carouselRef, { prev, next });
  useCarouselKeyboard(prev, next, null);

  if (!items.length) {
    return null;
  }

  return (
    <div className={styles.carouselWrap} ref={carouselRef}>
      <div className={styles.carouselTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
        {items.map((item) => (
          <article className={styles.card} key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            className={`${styles.navButton} ${styles.left}`}
            onClick={prev}
            aria-label="Previous testimonial"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.navButton} ${styles.right}`}
            onClick={next}
            aria-label="Next testimonial"
          >
            ›
          </button>

          <div className={styles.dots} aria-hidden>
            {items.map((_, i) => (
              <span
                key={`${items[i].title || "story"}-${i}`}
                className={`${styles.dot} ${i === index ? styles.activeDot : ""}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
