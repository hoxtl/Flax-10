import { useRef, useState } from "react";

export function useModuleCourseFilterState() {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const ref = useRef(null);

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    isOpen,
    setIsOpen,
    filterQuery,
    setFilterQuery,
    expanded,
    toggleExpanded,
    ref,
  };
}
