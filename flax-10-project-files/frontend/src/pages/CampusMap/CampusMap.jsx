/**
 * Campus map page entry point.
 */
import "mapbox-gl/dist/mapbox-gl.css";
import "./CampusMapGlobals.css";
import mapboxgl from "mapbox-gl";
import { CampusMapShell } from "../../components/CampusMap/CampusMapShell";
import { useCampusMapModel } from "./hooks/useCampusMapModel";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function CampusMap() {
  const model = useCampusMapModel();

  return <CampusMapShell {...model} />;
}
