export type DeliveryStatus = "available" | "not_configured" | "not_authorized";

export function verificationReadiness(challengeReady: boolean, delivery: DeliveryStatus): DeliveryStatus {
  return challengeReady ? delivery : "not_configured";
}
