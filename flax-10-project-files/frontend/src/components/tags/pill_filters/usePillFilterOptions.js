/*
 * Computes tag filter dropdown state.
 */

import { useMemo } from "react";
import { useTags } from "../../../context/TagContext";
import { countByType } from "../utils/pillUtils";
import {
  createPillFilterOptions,
  getActiveFilterLabel,
} from "./pillFilterOptions";

export function usePillFilterOptions({ active, items }) {
  const { tags } = useTags();
  const counts = countByType(items);

  return useMemo(() => {
    const options = createPillFilterOptions(tags, counts);
    return { activeLabel: getActiveFilterLabel(active, options), options };
  }, [active, counts, tags]);
}
