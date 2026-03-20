export function buildNavigateAction(onNavigate, target) {
  return () => onNavigate?.(target);
}

export function buildButtonActionProps(isInteractive, onActivate) {
  if (!isInteractive) return {};
  return {
    onClick: onActivate,
    role: "button",
    tabIndex: 0,
    onKeyDown: (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onActivate();
    },
  };
}
