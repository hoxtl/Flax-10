/*
 * Analytics page URL state helpers.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PERIODS, TABS } from '../utils/pageConfig';

const DEFAULT_PERIOD = 30;
const DEFAULT_TAB = 'Overview';

const isValidPeriod = (value) => PERIODS.some((item) => item.value === value);
const isValidTab = (value) => TABS.some((item) => item.id === value);

const getResolvedPeriod = (searchParams) => {
  const requestedPeriod = Number(searchParams.get('period'));
  return isValidPeriod(requestedPeriod) ? requestedPeriod : DEFAULT_PERIOD;
};

const getResolvedTab = (searchParams) => {
  const requestedTab = searchParams.get('tab');
  return isValidTab(requestedTab) ? requestedTab : DEFAULT_TAB;
};

const buildNextSearchParams = (searchParams, period, tab) => {
  const next = new URLSearchParams(searchParams);
  next.set('period', String(period));
  next.set('tab', tab);
  return next;
};

const syncState = (setter, value) => setter(value);

const updateSearchState = (setSearchParams, searchParams, period, tab) =>
  setSearchParams(buildNextSearchParams(searchParams, period, tab), { replace: true });

export function useAnalyticsPageState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resolvedPeriod = getResolvedPeriod(searchParams);
  const resolvedTab = getResolvedTab(searchParams);
  const [period, setPeriod] = useState(resolvedPeriod);
  const [activeTab, setActiveTab] = useState(resolvedTab);
  useEffect(() => syncState(setPeriod, resolvedPeriod), [resolvedPeriod]);
  useEffect(() => syncState(setActiveTab, resolvedTab), [resolvedTab]);
  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    updateSearchState(setSearchParams, searchParams, nextPeriod, activeTab);
  };
  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    updateSearchState(setSearchParams, searchParams, period, nextTab);
  };
  return { activeTab, handlePeriodChange, handleTabChange, period };
}
