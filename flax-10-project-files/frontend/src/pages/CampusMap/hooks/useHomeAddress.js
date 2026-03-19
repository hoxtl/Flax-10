import { useState, useEffect } from 'react';
import { getHomeAddress } from '../../../api/userService';

export function useHomeAddress() {
  const [userHome, setUserHome] = useState(null);

  const loadHomeAddress = async () => {
    try {
      const data = await getHomeAddress();
      if (!data.home_latitude || !data.home_longitude) return;
      setUserHome({ address: data.home_address, lat: data.home_latitude, lng: data.home_longitude });
    } catch (error) {
      console.error('User home could not be loaded: ', error);
    }
  };

  useEffect(() => {
    loadHomeAddress();
    window.addEventListener('home-address-updated', loadHomeAddress);
    return () => window.removeEventListener('home-address-updated', loadHomeAddress);
  }, []);

  return { userHome };
}
