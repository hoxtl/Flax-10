/**
 * Shared catalogue/layout fixtures for Intelligence grid widget tests.
 */

export const intelligenceGridStyles = {
  addIcon: "addIcon",
  addLabel: "addLabel",
  addWidgetSlot: "slot",
  editMode: "editMode",
  widgetClip: "clip",
  widgetContent: "content",
  widgetWrapper: "w",
};

export const baseCatalogueHero = [
  { col: 2, id: "hero", maxRow: 4, minRow: 1, row: 2 },
  { col: 1, id: "w1", maxCol: 2, maxRow: 3, minCol: 1, minRow: 1, row: 1 },
];

export const catalogueWithCustomWidget = [
  ...baseCatalogueHero,
  { col: 1, id: "custom-tool", row: 1 },
];
