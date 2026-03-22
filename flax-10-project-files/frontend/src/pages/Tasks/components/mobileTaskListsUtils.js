/*
 * Data shaping helpers for the mobile task lists modal.
 */

import { isReadingList } from "../utils/readingListUtils";

export function splitMobileLists(lists = []) {
  return {
    readingLists: lists.filter(isReadingList),
    lifeLists: lists.filter((list) => !isReadingList(list)),
  };
}

function createSectionProps(title, lists, listCounts, activeListId, onSelectList, emptyMessage) {
  return { title, lists, listCounts, activeListId, onSelectList, emptyMessage };
}

export function getMobileListSectionProps(lists, listCounts, activeListId, onSelectList) {
  const { readingLists, lifeLists } = splitMobileLists(lists);
  return {
    readingProps: createSectionProps("READING LISTS", readingLists, listCounts, activeListId, onSelectList, "No reading lists"),
    lifeProps: createSectionProps("LIFE LISTS", lifeLists, listCounts, activeListId, onSelectList, "No life lists"),
  };
}
