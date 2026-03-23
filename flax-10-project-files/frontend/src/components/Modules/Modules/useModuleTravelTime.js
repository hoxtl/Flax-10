/*
 * Travel-time hook for module details.
 */

import { useEffect, useState } from "react";
import { getHomeAddress } from "../../../api/userApi.js";
import { getTravelTimeModule } from "../../../utils/tflTravelTime.js";

function loadTravelTime(location, setTravelTime) {
  getHomeAddress()
    .then((homeAddress) => getTravelTimeModule(homeAddress, location))
    .then((travelInfo) => setTravelTime(travelInfo?.duration || null))
    .catch(() => setTravelTime(null));
}

export function useModuleTravelTime(location) {
  const [travelTime, setTravelTime] = useState(null);
  useEffect(() => {
    if (!location) return;
    loadTravelTime(location, setTravelTime);
  }, [location]);
  return travelTime;
}
