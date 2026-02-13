import { useState } from "react";
import styles from "./SocietyDetailPage.module.css";
import { MOCK_SOCIETY_DETAILS } from "./SocietyData";
import SocietyHero from "../components/Society/SocietyDetail/SocietyHero";
import SocietyInfo from "../components/Society/SocietyDetail/SocietyInfo";
import SocietyTabs from "../components/Society/SocietyDetail/SocietyTabs";
import SocietySidebar from "../components/Society/SocietyDetail/SocietySidebar";
import ImageGalleryModal from "../components/Society/SocietyDetail/ImageGalleryModal";

export default function SocietyDetailPage({ society, onBack }) {
    const [activeTab, setActiveTab] = useState("calendar");
    const [galleryOpen, setGalleryOpen] = useState(false);

    if (!society) return <NotFound onBack={onBack} />;

    const details = MOCK_SOCIETY_DETAILS[society.id] || {};

    return (
        <div className={styles.page}>
            <BackButton onBack={onBack} />
            <SocietyHero society={society} details={details} onImageClick={() => setGalleryOpen(true)} />
            <SocietyInfo society={society} details={details} />
            <MainContent activeTab={activeTab} setActiveTab={setActiveTab} details={details} />
            {galleryOpen && <ImageGalleryModal images={details.images || []} onClose={() => setGalleryOpen(false)} />}
        </div>
    );
}

function BackButton({ onBack }) {
    return (
        <button className={styles.backBtn} onClick={onBack}>&larr; Back to Societies</button>
    );
}

function NotFound({ onBack }) {
    return (
        <div className={styles.notFound}>
            <p>Society not found.</p>
            <button onClick={onBack}>Back to Societies</button>
        </div>
    );
}

function MainContent({ activeTab, setActiveTab, details }) {
    return (
        <div className={styles.mainContent}>
            <div className={styles.tabSection}>
                <SocietyTabs activeTab={activeTab} onTabChange={setActiveTab} details={details} />
            </div>
            <SocietySidebar details={details} />
        </div>
    );
}
