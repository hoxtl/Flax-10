/*
 * Animated analytics list.
 */

import { useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './AnimatedList.module.css';

const MotionDiv = motion.div;

const calcBottomOpacity = (scrollHeight, scrollTop, clientHeight) =>
  scrollHeight <= clientHeight ? 0 : Math.min((scrollHeight - scrollTop - clientHeight) / 50, 1);

const DefaultListItem = ({ item, isSelected }) => (
  <div className={`${styles.item} ${isSelected ? styles.selected : ''}`}>
    <p className={styles.itemText}>{item}</p>
  </div>
);

const GradientOverlays = ({ topOpacity, bottomOpacity }) => (
  <>
    <div className={styles.topGradient} style={{ opacity: topOpacity }} />
    <div className={styles.bottomGradient} style={{ opacity: bottomOpacity }} />
  </>
);

const renderDefaultItem = (item, index, selectedIndex) => (
  <DefaultListItem item={item} isSelected={selectedIndex === index} />
);

const getItemContent = (renderItem, item, index, selectedIndex) =>
  (renderItem ? renderItem(item, index, selectedIndex === index) : renderDefaultItem(item, index, selectedIndex));

const AnimatedItem = ({ children, delay, index, onMouseEnter, onClick }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });
  return (
    <MotionDiv
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      initial={{ scale: 0.92, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0 }}
      transition={{ duration: 0.22, delay }}
      className={styles.animatedItem}
    >
      {children}
    </MotionDiv>
  );
};

function ListViewport({ children, displayScrollbar, handleScroll, listRef }) {
  return (
    <div ref={listRef} className={`${styles.list} ${!displayScrollbar ? styles.noScrollbar : ''}`} onScroll={handleScroll}>
      {children}
    </div>
  );
}

function renderListItem(item, index, renderItem, selectedIndex, setSelectedIndex) {
  return (
    <AnimatedItem key={`anim-${index}`} delay={index * 0.05} index={index} onMouseEnter={() => setSelectedIndex(index)}>
      {getItemContent(renderItem, item, index, selectedIndex)}
    </AnimatedItem>
  );
}

const AnimatedList = ({ items = [], renderItem, showGradients = true, className = '', displayScrollbar = true }) => {
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);
  const handleScroll = useCallback(e => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setTopOpacity(Math.min(scrollTop / 50, 1));
    setBottomOpacity(calcBottomOpacity(scrollHeight, scrollTop, clientHeight));
  }, []);
  return (
    <div className={`${styles.container} ${className}`}>
      <ListViewport displayScrollbar={displayScrollbar} handleScroll={handleScroll} listRef={listRef}>
        {items.map((item, index) => renderListItem(item, index, renderItem, selectedIndex, setSelectedIndex))}
      </ListViewport>
      {showGradients && <GradientOverlays topOpacity={topOpacity} bottomOpacity={bottomOpacity} />}
    </div>
  );
};

export default AnimatedList;
