import styles from "./TestimonialCard.module.css";

function TestimonialAvatar({ src, name }) {
  return (
    <div className={styles.avatar}>
      <img src={src} alt={name} className={styles.avatarImg} />
    </div>
  );
}

function TestimonialAuthorInfo({ name, handle }) {
  return (
    <div className={styles.authorInfo}>
      <span className={styles.authorName}>{name}</span>
      <span className={styles.authorHandle}>{handle}</span>
    </div>
  );
}

export function TestimonialCard({ author, text, href }) {
  const Tag = href ? "a" : "div";
  return (
    <Tag href={href} className={styles.card}>
      <div className={styles.author}>
        <TestimonialAvatar src={author.avatar} name={author.name} />
        <TestimonialAuthorInfo name={author.name} handle={author.handle} />
      </div>
      <p className={styles.text}>{text}</p>
    </Tag>
  );
}