import { useEffect, useState } from "react";

export default function useSyncedToggleState(storageKey, defaultValue = true) {
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return defaultValue;
    return raw === "true";
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(value));
  }, [storageKey, value]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== storageKey || event.newValue === null) return;
      setValue(event.newValue === "true");
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  return [value, setValue];
}
