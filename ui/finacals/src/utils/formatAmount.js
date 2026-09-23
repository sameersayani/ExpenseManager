// src/utils/formatAmount.js
import { CURRENCIES } from "../constants/currencies";

const LOCALE_MAP = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
};

export function formatAmount(amount, currency = "INR") {
  if (amount === null || amount === undefined || amount === "" || isNaN(Number(amount))) {
    return "-";
  }

  const currencyInfo = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  const locale = LOCALE_MAP[currency] || "en-US";

  const formattedNumber = Number(amount).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${currencyInfo.symbol}${formattedNumber}`;
}