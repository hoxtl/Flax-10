/*
 * Shared motion variants for module dashboard widgets.
 */
export const expandBodyVariants = {
    collapsed: { opacity: 0, height: 0 },
    expanded: {
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.26, ease: [0.23, 1, 0.32, 1] },
    },
};

export const listVariants = {
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

export const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};
