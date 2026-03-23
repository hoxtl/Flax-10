/**
 * Home address data hook for the campus map page.
 */
import { useState, useEffect } from 'react';
import { getHomeAddress } from '../../../api/userApi';

function applyHomeData(data, setUserHome) {
  if (!data.home_latitude || !data.home_longitude) return;
  setUserHome({ address: data.home_address, lat: data.home_latitude, lng: data.home_longitude });
}

async function fetchHomeAddress(setUserHome) {
  try {
    const data = await getHomeAddress();
    applyHomeData(data, setUserHome);
  } catch {}
}

export function useHomeAddress() {
  const [userHome, setUserHome] = useState(null);
  const load = () => fetchHomeAddress(setUserHome);

  useEffect(() => {
    load();
    window.addEventListener('home-address-updated', load);
    return () => window.removeEventListener('home-address-updated', load);
  }, []);

  return { userHome };
}
