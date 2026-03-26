/*
 * Analytics page configuration.
 */

export const PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export const TABS = [
  { id: 'Overview', icon: '📊', label: 'Overview' },
  { id: 'AI Insights', icon: '✨', label: 'AI Insights' },
];

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};
