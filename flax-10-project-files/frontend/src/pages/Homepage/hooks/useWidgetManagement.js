export function useWidgetManagement(homepageWidgets, saveWidgetLayout) {
  const moveWidget = (index, direction) => {
    const newLayout = [...homepageWidgets];
    const target = index + direction;
    if (target >= 0 && target < newLayout.length) {
      [newLayout[index], newLayout[target]] = [newLayout[target], newLayout[index]];
      saveWidgetLayout(newLayout);
    }
  };

  const removeWidget = (index) => {
    saveWidgetLayout(homepageWidgets.filter((_, i) => i !== index));
  };

  const addWidget = (id) => {
    saveWidgetLayout([...homepageWidgets, { id, type: "system" }]);
  };

  return { moveWidget, removeWidget, addWidget };
}
