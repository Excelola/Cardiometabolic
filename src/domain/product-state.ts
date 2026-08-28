export const PRODUCT_STATES = [
  "Account Created",
  "Consent Required",
  "Setup Not Started",
  "Setup In Progress",
  "Baseline Data Needed",
  "Summary Pending Inputs",
  "Summary Available",
  "Active Monitoring",
] as const;

export type ProductState = (typeof PRODUCT_STATES)[number];

export const MOCK_CURRENT_PRODUCT_STATE: ProductState = "Setup In Progress";

export function isProductState(value: string): value is ProductState {
  return PRODUCT_STATES.some((state) => state === value);
}
