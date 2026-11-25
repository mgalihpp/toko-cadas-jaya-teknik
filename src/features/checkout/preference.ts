export type Fulfillment = "kirim" | "ambil";

const KEY = "cjt:fulfillment";

export function getPreferredFulfillment(): Fulfillment | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(KEY);
  return value === "kirim" || value === "ambil" ? value : null;
}

export function setPreferredFulfillment(value: Fulfillment) {
  window.sessionStorage.setItem(KEY, value);
}
