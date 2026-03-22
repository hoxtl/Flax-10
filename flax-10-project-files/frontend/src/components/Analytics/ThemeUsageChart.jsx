import { PieChart } from "@mui/x-charts/PieChart";
import EmptyState from "../Common/EmptyState/EmptyState";

const LIGHT_COLOR = "#FFD54F";
const DARK_COLOR = "#5C6BC0";

const formatPercentage = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0%";
  const rounded = Math.round(num * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

const PIE_SERIES = (summary) => {
  const darkPct = summary.dark_percentage ?? 0;
  const lightPct = summary.light_percentage ?? 0;
  return [
    {
      data: [
        {
          id: 0,
          value: summary.light_minutes,
          label: `Light Mode ${formatPercentage(lightPct)}`,
          color: LIGHT_COLOR,
        },
        {
          id: 1,
          value: summary.dark_minutes,
          label: `Dark Mode ${formatPercentage(darkPct)}`,
          color: DARK_COLOR,
        },
      ],
      innerRadius: 50,
      outerRadius: 100,
      paddingAngle: 3,
      cornerRadius: 4,
    },
  ];
};

const getBadge = (darkPct) => {
  if (darkPct >= 60) return "🦉 Night Owl";
  if (darkPct >= 30) return "🌗 Mixed";
  return "☀️ Day Worker";
};

const ChartHeader = ({ badge, peakDarkHour }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      marginBottom: "0.5rem",
      flexWrap: "wrap",
      minWidth: 0,
    }}
  >
    <span
      style={{
        fontSize: "1.25rem",
        fontWeight: 600,
        color: "var(--text)",
        minWidth: 0,
      }}
    >
      {badge}
    </span>
    {peakDarkHour && (
      <span style={{ fontSize: "0.8rem", color: "var(--muted)", minWidth: 0 }}>
        Peak dark mode: {peakDarkHour}
      </span>
    )}
  </div>
);

const LegendItem = ({ color, label, percentage }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.42rem",
      minWidth: 0,
      fontSize: "0.78rem",
      color: "var(--text)",
      fontWeight: 600,
    }}
  >
    <span
      aria-hidden
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "999px",
        background: color,
        flexShrink: 0,
      }}
    />
    <span style={{ minWidth: 0 }}>{label}</span>
    <span style={{ color: "var(--muted)", fontWeight: 500 }}>{percentage}</span>
  </div>
);

const ThemeLegend = ({ summary }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.9rem",
      marginTop: "0.5rem",
      minWidth: 0,
    }}
  >
    <LegendItem
      color={LIGHT_COLOR}
      label="Light Mode"
      percentage={formatPercentage(summary.light_percentage ?? 0)}
    />
    <LegendItem
      color={DARK_COLOR}
      label="Dark Mode"
      percentage={formatPercentage(summary.dark_percentage ?? 0)}
    />
  </div>
);

const ThemeUsageChart = ({ themeStats }) => {
  const { summary } = themeStats;
  const darkPct = summary.dark_percentage ?? 0;
  return (
    <div>
      <ChartHeader
        badge={getBadge(darkPct)}
        peakDarkHour={summary.peak_dark_hour}
      />
      {summary.total_minutes === 0 ? (
        <EmptyState
          icon="🌓"
          title="No theme session data yet"
          description="Keep using the app and your light/dark usage will appear here."
        />
      ) : (
        <>
          <div
            style={{ display: "flex", justifyContent: "center", width: "100%" }}
          >
            <PieChart
              series={PIE_SERIES(summary)}
              height={220}
              sx={{
                "& .MuiChartsLegend-root": { display: "none" },
              }}
            />
          </div>
          <ThemeLegend summary={summary} />
        </>
      )}
    </div>
  );
};

export default ThemeUsageChart;
