import styles from "./SocietyHero.module.css";

export default function SocietyHero({ society, details, onImageClick, editMode }) {
    const mainImage = details.images?.[0] || society.image;
    const imageCount = details.images?.length || 1;

    return (
        <div className={styles.hero} style={{ backgroundImage: `url(${mainImage})` }} onClick={onImageClick}>
            <div className={styles.overlay}>
                <HeroContent society={society} imageCount={imageCount} />
                {editMode && <EditImageButton />}
            </div>
        </div>
    );
}

function EditImageButton() {
    const handleClick = (e) => { e.stopPropagation(); console.log("Edit hero images"); };
    return <button className={styles.editImageBtn} onClick={handleClick}>Change Cover</button>;
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
