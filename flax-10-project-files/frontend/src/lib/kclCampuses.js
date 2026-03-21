/*
 * KCL campus coordinates, name aliases, and accent colours for the map.
 */

export const KCL_CAMPUSES = [
  {
    id: "strand",
    name: "Strand Campus",
    shortName: "Strand",
    coords: [-0.116, 51.5114],
    address: "Strand, London WC2R 2LS",
    color: "#9E7E5D",
    aliases: [
      "strand",
      "strand campus",
      "kcl strand",
      "somerset house",
      "bush house",
      "aldwych",
      "king's building",
      "kings building",
    ],
  },
  {
    id: "guys",
    name: "Guy's Campus",
    shortName: "Guy's",
    coords: [-0.0877, 51.5034],
    address: "Great Maze Pond, London SE1 9RT",
    color: "#7A6048",
    aliases: [
      "guy's",
      "guys",
      "guy's campus",
      "guys campus",
      "great maze pond",
      "london bridge",
    ],
  },
  {
    id: "waterloo",
    name: "Waterloo Campus",
    shortName: "Waterloo",
    coords: [-0.1155, 51.506],
    address: "150 Stamford St, London SE1 9NH",
    color: "#B8956A",
    aliases: ["waterloo", "waterloo campus", "kcl waterloo", "stamford st"],
  },
  {
    id: "st_thomas",
    name: "St Thomas Campus",
    shortName: "St Thomas",
    coords: [-0.1176, 51.4986],
    address: "Westminster Bridge Rd, London SE1 7EH",
    color: "#6B7F6B",
    aliases: ["st thomas", "st thomas campus", "westminster bridge"],
  },
  {
    id: "denmark_hill",
    name: "Denmark Hill Campus",
    shortName: "Denmark Hill",
    coords: [-0.0934, 51.4686],
    address: "Denmark Hill, London SE5 9RS",
    color: "#7B6E9E",
    aliases: ["denmark hill", "denmark hill campus", "camberwell"],
  },
];

export function resolveCampusFromText(value) {
  const text = String(value || "").toLowerCase().trim();
  if (!text) return null;
  return (
    KCL_CAMPUSES.find((campus) =>
      campus.aliases.some((alias) => text.includes(alias) || alias.includes(text)),
    ) || null
  );
}
