"use client";

import { useEffect } from "react";

import { recordSessionActivity } from "@/app/session-activity-action";

const CLIENT_ACTIVITY_REQUEST_INTERVAL_MS = 5 * 60 * 1000;

export function SessionActivity({ csrf }: Readonly<{ csrf: string }>) {
  useEffect(() => {
    let lastRequestAt = 0;
    let requestInFlight = false;

    const requestRenewal = (event: Event) => {
      if (!event.isTrusted || document.visibilityState !== "visible"
        || (event instanceof KeyboardEvent && event.repeat)) return;

      const now = Date.now();
      if (requestInFlight || now - lastRequestAt < CLIENT_ACTIVITY_REQUEST_INTERVAL_MS) return;

      lastRequestAt = now;
      requestInFlight = true;
      void recordSessionActivity(csrf).catch(() => {}).finally(() => {
        requestInFlight = false;
      });
    };

    window.addEventListener("pointerdown", requestRenewal, { passive: true });
    window.addEventListener("wheel", requestRenewal, { passive: true });
    window.addEventListener("keydown", requestRenewal);

    return () => {
      window.removeEventListener("pointerdown", requestRenewal);
      window.removeEventListener("wheel", requestRenewal);
      window.removeEventListener("keydown", requestRenewal);
    };
  }, [csrf]);

  return null;
}
