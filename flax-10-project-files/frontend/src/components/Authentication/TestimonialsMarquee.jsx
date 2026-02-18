import { TestimonialCard } from "./TestimonialCard";
import styles from "./TestimonialsMarquee.module.css";

const TESTIMONIALS = [
  {
    author: { name: "Ashley Travino", handle: "@ashley", avatar: "https://images.unsplash.com/photo-1578774296842-c45e472b3028?q=80&w=973&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "StudyFlax completely changed how I manage my deadlines. I actually feel in control of my week now.",
  },
  {
    author: { name: "Vladmir Rockfeller", handle: "@rockfellerVlad99", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "The calendar integration is awesome. Having lectures and tasks in one place saves me so much stress.",
  },
  {
    author: { name: "Marcus Chen", handle: "@marcuschen", avatar: "https://images.unsplash.com/photo-1611608822772-43a28a830759?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "Genuinely can't believe this is free. There's got to be a catch. I've been waiting.",
  },
  {
    author: { name: "Jonathon Bank", handle: "@bankjohn", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "I do my best work at 2am. Dark mode means my eyes survive long enough to submit.",
  },
  {
    author: { name: "Lily Thompson", handle: "@lilyt", avatar: "https://images.unsplash.com/photo-1644860704769-c61c84be7836?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "The to-do panel is always there when I need it. Love that it floats over everything.",
  },
  {
    author: { name: "Dev Malhotra", handle: "@devmalhotra", avatar: "https://images.unsplash.com/photo-1698356253803-838dceb68946?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    text: "The map is just brilliant. Finally knowing my commute time to Strand means no more sprinting to my 9am.",
  },
  {
    author: { name: "Zara Ellis", handle: "@zaraellis", avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face" },
    text: "I set a Pomodoro timer for every task block and it completely stopped me doom-scrolling between sessions.",
  },
  {
    author: { name: "Neela Bennett", handle: "@nebe1218", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
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