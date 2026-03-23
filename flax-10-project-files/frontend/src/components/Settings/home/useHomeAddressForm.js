/*
 * Home-address state loading and save tracking.
 */

import { useEffect, useState } from "react";
import { getHomeAddress } from "../../../api/userApi";

export default function useHomeAddressForm() {
  const [homeAddress, setHomeAddress] = useState("");
  const [initialHomeAddress, setInitialHomeAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveSignal, setSaveSignal] = useState(0);

  useEffect(() => {
    getHomeAddress()
      .then((data) => {
        const address = data.home_address || "";
        setHomeAddress(address);
        setInitialHomeAddress(address);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markSaved = () => { setInitialHomeAddress(homeAddress); setSaveSignal((count) => count + 1); };
  return { homeAddress, setHomeAddress, loading, saveSignal, hasUnsaved: homeAddress !== initialHomeAddress, markSaved };
}
