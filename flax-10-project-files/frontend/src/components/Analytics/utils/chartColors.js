import chartColorConstants from './chartColorConstants.json';

export const getChartColors = (theme) => ({
  textColor: chartColorConstants[theme]?.textColor ?? chartColorConstants.light.textColor,
  gridColor: chartColorConstants[theme]?.gridColor ?? chartColorConstants.light.gridColor,
});

export const getChartSx = (textColor, gridColor) => ({
  '& .MuiChartsGrid-line': { stroke: gridColor },
  '& .MuiChartsLegend-label': { fill: `${textColor} !important` },
  '& .MuiChartsAxis-line': { stroke: gridColor },
  '& .MuiChartsAxis-tick': { stroke: gridColor },
});
