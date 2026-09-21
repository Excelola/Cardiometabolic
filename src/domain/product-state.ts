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

export const PRODUCT_STATE_DETAILS: Readonly<Record<ProductState, string>> = {
  "Account Created": "Account created. Continue to the required consent step.",
  "Consent Required": "Review the required information before health-data collection.",
  "Setup Not Started": "Start your basic profile and approved health setup.",
  "Setup In Progress": "Continue from the last completed step.",
  "Baseline Data Needed": "Add the approved baseline information required for the experience.",
  "Summary Pending Inputs": "Complete approved missing inputs before a summary can be generated.",
  "Summary Available": "The approved current summary is available.",
  "Active Monitoring": "Continue recording supported information and reviewing changes over time.",
};

export const MOCK_CURRENT_PRODUCT_STATE: ProductState = "Setup In Progress";

export function isProductState(value: string): value is ProductState {
  return PRODUCT_STATES.some((state) => state === value);
}
