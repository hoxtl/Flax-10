import styles from './Charts.module.css';
import { useTheme } from '../../context/ThemeContext';

const StudyHeatmap = ({ heatmapData }) => {
  const { mode: theme } = useTheme();
  const { data, days, hours } = heatmapData;
  
  // Find max value for color scaling
  const maxValue = Math.max(...data.flat());
  
  // Get color intensity based on value
  const getColor = (value) => {
    if (value === 0) return theme === 'dark' ? '#1a1a1a' : '#f9f9f9';
    
    const intensity = value / maxValue;
    const baseColor = theme === 'dark' 
      ? { r: 76, g: 175, b: 80 }  // Green
      : { r: 76, g: 175, b: 80 };
    
    const alpha = 0.2 + (intensity * 0.8); // Range from 0.2 to 1.0
    return `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`;
  };
  
  // Format hours for display (show every 3 hours)
  const displayHours = hours.filter((h, i) => i % 3 === 0).map(h => 
    h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`
  );

  return (
    <div className={styles.heatmapContainer}>
      <div className={styles.heatmapGrid}>
        {/* Day labels */}
        <div className={styles.dayLabels}>
          {days.map(day => (
            <div key={day} className={styles.dayLabel}>{day}</div>
          ))}
        </div>
        
        {/* Hour labels and grid */}
        <div className={styles.gridContainer}>
          <div className={styles.hourLabels}>
            {displayHours.map((hour, i) => (
              <div key={i} className={styles.hourLabel}>{hour}</div>
            ))}
          </div>
          
          <div className={styles.grid}>
            {data.map((dayData, dayIndex) => (
              <div key={dayIndex} className={styles.gridRow}>
                {dayData.map((value, hourIndex) => (
                  <div
                    key={hourIndex}
                    className={styles.gridCell}
                    style={{ backgroundColor: getColor(value) }}
                    title={`${days[dayIndex]} ${hours[hourIndex]}:00 - ${value} minutes`}
                  >
                    {value > 0 && value > maxValue * 0.3 && (
                      <span className={styles.cellValue}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={styles.legendGradient}>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <div 
              key={i} 
              className={styles.legendBox}
              style={{ 
                backgroundColor: intensity === 0 
                  ? (theme === 'dark' ? '#1a1a1a' : '#f5f5f5')
                  : `rgba(76, 175, 80, ${0.2 + intensity * 0.8})`
              }}
            />
          ))}
        </div>
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  );
};

export default StudyHeatmap;
