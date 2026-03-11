import {useState, useEffect} from "react";
import { getSuggestedReadings, getReadingSpeed } from "../../../api/readingApi";

export default function useSuggestedReadings(taskCount) {
    const [readings, setReadings] = useState([]);
    const [allAdded, setAllAdded] = useState(false);
    const [speedData, setSpeedData] = useState(null);

    useEffect(() => { async function load() {
      const [readingsData, speed] = await Promise.all([getSuggestedReadings(), getReadingSpeed()]);
      setReadings(readingsData || []); setSpeedData(speed); setAllAdded(false);
    }
    load().catch(() => {
      setReadings([]); setSpeedData(null);
    });
  }, [taskCount]);

  return {readings, setReadings, allAdded, setAllAdded, speedData, setSpeedData};
}
