import { useState } from "react";
import styles from "./SocietyInfo.module.css";

export default function SocietyInfo({ society, details }) {
    return (
        <div className={styles.info}>
            <Bio text={details.bio} />
            <Stats society={society} details={details} />
            <JoinButton isMember={details.isMember} isPrivate={society.isPrivate} />
        </div>
    );
}

function Bio({ text }) {
    if (!text) return null;
    return <p className={styles.bio}>{text}</p>;
}

function Stats({ society, details }) {
    return (
        <div className={styles.stats}>
            <span>{society.memberCount} members</span>
            {society.isRatified && <span className={styles.badge}>Ratified</span>}
            {details.dateCreated && <span>Est. {formatYear(details.dateCreated)}</span>}
        </div>
    );
}

function JoinButton({ isMember, isPrivate }) {
    const [status, setStatus] = useState(isMember ? "joined" : "not_joined");
    const handleClick = () => handleJoinClick(status, isPrivate, setStatus);
    const label = getButtonLabel(status);
    const className = getButtonClass(status);

    return <button className={className} onClick={handleClick}>{label}</button>;
}

function handleJoinClick(status, isPrivate, setStatus) {
    if (status === "joined") return setStatus("not_joined");
    if (status === "requested") return setStatus("not_joined");
    if (isPrivate) return setStatus("requested");
    return setStatus("joined");
}

function getButtonLabel(status) {
    if (status === "joined") return "Joined";
    if (status === "requested") return "Requested";
    return "Join Society";
}

function getButtonClass(status) {
    if (status === "joined") return styles.joinedBtn;
    if (status === "requested") return styles.requestedBtn;
    return styles.joinBtn;
}

function formatYear(dateStr) {
    return new Date(dateStr).getFullYear();
}
