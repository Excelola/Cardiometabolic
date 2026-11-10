"use client";

import { useEffect, useState } from "react";

function utcFallback(value: string, dayOnly: boolean) {
  const date = new Date(dayOnly ? `${value}T00:00:00.000Z` : value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: dayOnly ? undefined : "short",
    timeZone: "UTC",
  }).format(date) + (dayOnly ? "" : " UTC");
}

export function LocalOccurrenceTime({ value, dayOnly }: Readonly<{ value: string; dayOnly: boolean }>) {
  const [label, setLabel] = useState(() => utcFallback(value, dayOnly));

  useEffect(() => {
    const date = new Date(dayOnly ? `${value}T00:00:00.000Z` : value);
    if (!Number.isFinite(date.getTime())) return;
    setLabel(new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: dayOnly ? undefined : "short",
      ...(dayOnly ? { timeZone: "UTC" } : {}),
    }).format(date));
  }, [dayOnly, value]);

  return <time dateTime={value}>{label}</time>;
}
