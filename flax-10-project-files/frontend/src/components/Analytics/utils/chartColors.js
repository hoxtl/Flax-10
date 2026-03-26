<<<<<<< HEAD
import chartColorConstants from './chartColorConstants.json';

export const getChartColors = (theme) => ({
  textColor: chartColorConstants[theme]?.textColor ?? chartColorConstants.light.textColor,
  gridColor: chartColorConstants[theme]?.gridColor ?? chartColorConstants.light.gridColor,
=======
export const getChartColors = (theme) => ({
  textColor: theme === 'dark' ? 'rgba(200,184,164,0.85)' : 'rgba(43,30,20,0.55)',
  gridColor: theme === 'dark' ? 'rgba(180,164,144,0.2)' : 'rgba(74,52,33,0.15)',
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
});

export const getChartSx = (textColor, gridColor) => ({
  '& .MuiChartsGrid-line': { stroke: gridColor },
  '& .MuiChartsLegend-label': { fill: `${textColor} !important` },
  '& .MuiChartsAxis-line': { stroke: gridColor },
  '& .MuiChartsAxis-tick': { stroke: gridColor },
});
