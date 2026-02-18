import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './AnimatedList.module.css';

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0 }}
      transition={{ duration: 0.22, delay }}
      style={{ marginBottom: '0.625rem', cursor: 'default' }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedList = ({
  items = [],
  renderItem,
  showGradients = true,
  className = '',
  displayScrollbar = true,
}) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const handleScroll = useCallback(e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(
      scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
    );
  }, []);

  return (
    <div className={`${styles.container} ${className}`}>
      <div
        ref={listRef}
        className={`${styles.list} ${!displayScrollbar ? styles.noScrollbar : ''}`}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <AnimatedItem
            key={`anim-${index}`}
            delay={index * 0.05}
            index={index}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            {renderItem ? renderItem(item, index, selectedIndex === index) : (
              <div className={`${styles.item} ${selectedIndex === index ? styles.selected : ''}`}>
                <p className={styles.itemText}>{item}</p>
              </div>
            )}
          </AnimatedItem>
        ))}
      </div>
      {showGradients && (
        <>
          <div className={styles.topGradient} style={{ opacity: topGradientOpacity }} />
          <div className={styles.bottomGradient} style={{ opacity: bottomGradientOpacity }} />
        </>
      )}
    </div>
  );
};

export default AnimatedList;
