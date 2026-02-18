import { TestimonialCard } from "./TestimonialCard";
import styles from "./TestimonialsMarquee.module.css";

const TESTIMONIALS = [
  {
    author: { name: "Ashley Travino", handle: "@ashley", avatar: "https://images.unsplash.com/photo-1617608587073-7ca62257c52d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "StudyFlax completely changed how I manage my deadlines. I actually feel in control of my week now.",
  },
  {
    author: { name: "Vladmir Rockfeller", handle: "@rockfellerVlad99", avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "The calendar integration is awesome. Having lectures and tasks in one place saves me so much stress.",
  },
  {
    author: { name: "Marcus Chen", handle: "@marcuschen", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face" },
    text: "Genuinely can't believe this is free. There's got to be a catch. I've been waiting.",
  },
  {
    author: { name: "Jonathon Bank", handle: "@banksjohn", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face" },
    text: "I do my best work at 2am. Dark mode means my eyes survive long enough to submit.",
  },
  {
    author: { name: "Lily Thompson", handle: "@lilyt", avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face" },
    text: "The to-do panel is always there when I need it. Love that it floats over everything.",
  },
  {
    author: { name: "Dev Malhotra", handle: "@devmalhotra", avatar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face" },
    text: "The map is just brilliant. Finally knowing my commute time to Strand means no more sprinting to my 9am.",
  },
  {
    author: { name: "Zara Ellis", handle: "@zaraellis", avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face" },
    text: "I set a Pomodoro timer for every task block and it completely stopped me doom-scrolling between sessions.",
  },
  {
    author: { name: "Noah Bennett", handle: "@noahb", avatar: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face" },
    text: "Lectures, deadlines, and tasks all in one place. My brain finally stopped buffering.",
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
      </div>
      <div className={styles.marqueeWrapper}>
        <MarqueeTrack />
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />
      </div>
    </section>
  );
}