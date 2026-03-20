/*
 * Task picker constants.
 */

export const SORT_URGENCY = 'urgency';
export const SORT_TIME = 'time';
export const SORT_DUE = 'due';
export const SORT_ALPHA = 'alpha';
export const SORT_DATE_ADDED = 'date_added';

export const SORT_OPTIONS = [
  { value: SORT_URGENCY, label: 'Urgency' },
  { value: SORT_DUE, label: 'Due date' },
  { value: SORT_ALPHA, label: 'A → Z' },
  { value: SORT_DATE_ADDED, label: 'Date added' },
  { value: SORT_TIME, label: 'Estimated time' },
];
