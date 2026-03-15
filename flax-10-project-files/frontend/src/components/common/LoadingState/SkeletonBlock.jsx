import styles from "./SkeletonBlock.module.css";

export default function SkeletonBlock({ className = "", style, ...props }) {
    const classNames = className ? `${styles.block} ${className}` : styles.block;
    return <div className={classNames} style={style} {...props} />;
}
