import styles from "./SocietyHero.module.css";

export default function SocietyHero({ society, details, onImageClick }) {
    const mainImage = details.images?.[0] || society.image;
    const imageCount = details.images?.length || 1;

    return (
        <div className={styles.hero} style={{ backgroundImage: `url(${mainImage})` }} onClick={onImageClick}>
            <div className={styles.overlay}>
                <HeroContent society={society} imageCount={imageCount} />
            </div>
        </div>
    );
}

function HeroContent({ society, imageCount }) {
    return (
        <div className={styles.content}>
            <h1 className={styles.name}>{society.name}</h1>
            <ImageCounter count={imageCount} />
        </div>
    );
}

function ImageCounter({ count }) {
    if (count <= 1) return null;
    return <span className={styles.imageCount}>{count} photos</span>;
}
