export type AuthPolicyConfig = Readonly<{
  otpExpirySeconds?: number;
  resendDelaySeconds?: number;
  maximumAttempts?: number;
  rateLimitPolicy?: string;
  provider?: string;
  fallbackRecovery?: string;
}>;

/**
 * These values are intentionally unset until product, security, and provider
 * decisions are approved. UI copy must not infer policy from missing values.
 */
export const authPolicyConfig: AuthPolicyConfig = {};
