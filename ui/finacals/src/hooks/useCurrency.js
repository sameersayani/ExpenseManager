import { useState, useEffect } from "react";

export function useCurrency() {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("selectedCurrency") || "";
  });

  useEffect(() => {
    if (currency) {
      localStorage.setItem("selectedCurrency", currency);
    } else {
      localStorage.removeItem("selectedCurrency");
    }
  }, [currency]);

  return [currency, setCurrency];
}