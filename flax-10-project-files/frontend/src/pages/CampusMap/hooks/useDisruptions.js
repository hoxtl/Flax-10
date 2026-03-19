import { useState, useEffect } from 'react';
import { tflService } from '../../../api/tflService';

export function useDisruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDisruptions = async () => {
    setLoading(true);
    try {
      const data = await tflService.getTfLDelays();
      setDisruptions(data);
    } catch (error) {
      console.error('TfL disruption fetch error: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisruptions();
    const interval = setInterval(fetchDisruptions, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { disruptions, loading };
}
