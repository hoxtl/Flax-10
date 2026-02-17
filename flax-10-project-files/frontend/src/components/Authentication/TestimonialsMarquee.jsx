import { TestimonialCard } from "./TestimonialCard";
import styles from "./TestimonialsMarquee.module.css";

const TESTIMONIALS = [
  {
    author: { name: "Priya Sharma", handle: "@priyastudy", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face" },
    text: "StudyFlax completely changed how I manage my deadlines. I actually feel in control of my week now.",
  },
  {
    author: { name: "James O'Brien", handle: "@jamesobrien", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" },
    text: "The calendar integration is brilliant. Having lectures and tasks in one place saves me so much stress.",
  },
  {
    author: { name: "Aisha Patel", handle: "@aishap", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face" },
    text: "I went from missing assignments to submitting everything early. This app is genuinely a game changer.",
  },
  {
    author: { name: "Marcus Chen", handle: "@marcuschen", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face" },
    text: "Clean, fast, and actually useful. Every uni student needs something like this.",
  },
  {
    author: { name: "Lily Thompson", handle: "@lilyt", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face" },
    text: "The to-do panel is always there when I need it. Love that it floats over everything.",
  },
];

function MarqueeTrack() {
  const repeated = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <div className={styles.track}>
      {repeated.map((t, i) => (
        <TestimonialCard key={i} author={t.author} text={t.text} href={t.href} />
      ))}
    </div>
  );
}

export function TestimonialsMarquee() {
  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Loved by students</h2>
      </div>
      <div className={styles.marqueeWrapper}>
        <MarqueeTrack />
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />
      </div>
    </section>
  );
}