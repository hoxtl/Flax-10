/*
 * GroupWork project progress circle.
 */

export default function ProjectProgressCircle({ percent, ringColor }) {
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r={radius} stroke="var(--border)" strokeWidth="3" fill="none" />
      <circle cx="12" cy="12" r={radius} stroke={ringColor} strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" transform="rotate(-90 12 12)" />
    </svg>
  );
}
