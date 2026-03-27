import { TestimonialCard } from "./TestimonialCard";
import styles from "../styles/TestimonialsMarquee.module.css";

const TESTIMONIALS = [
  {
    author: { name: "Professor Ashley Traveno", handle: "@ashley", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "StudyFlax re-anchors my week. Deadlines, reminders, and calendar events now move as one reliable system.",
  },
  {
    author: { name: "Vladmir Rockfeller", handle: "@rockfellerVlad99", avatar: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "One platform for lectures and tasks means no context switching; everything updates around my real schedule.",
  },
  {
    author: { name: "Neela Bennett", handle: "@nebe1218", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "My study stack is finally coherent. I can move from planning to execution without opening another tab.",
  },
  {
    author: { name: "Marcus Chen", handle: "@marcuschen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "The session-first layout gives me rhythm: plan, focus, close out, then move to the next block without drift.",
  },
  {
    author: { name: "Lily Thompson", handle: "@lilyt", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "The task page is my command center for study, not a list I leave behind after opening the app.",
  },
  {
    author: { name: "Jonathon Bank", handle: "@bankjohn", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "Even late-night sessions stay controlled; priorities stay visible and I can finish what I set out to do.",
  },
  {
    author: { name: "Zara Ellis", handle: "@zaraellis", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "Focus sessions and smart planning reduced procrastination and made every study block deliberate.",
  },
  {
    author: { name: "Dr. Hana Patel", handle: "@hpatel", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=500&h=500&auto=format&fit=crop&crop=faces&ixlib=rb-4.1.0" },
    text: "As a teacher, I can create modules, track deadlines, and keep students aligned from one shared planning space.",
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
      <div className={styles.marqueeWrapper}>
        <MarqueeTrack />
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />
      </div>
    </section>
  );
}
