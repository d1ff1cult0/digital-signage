const TIMEZONE = "Europe/Brussels";

const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function getBrusselsNow(): { day: string; time: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);

  const hour = parts.find((p) => p.type === "hour")!.value;
  const minute = parts.find((p) => p.type === "minute")!.value;
  const weekday = parts.find((p) => p.type === "weekday")!.value.toLowerCase();

  const dayIndex = new Date(
    now.toLocaleString("en-US", { timeZone: TIMEZONE })
  ).getDay();

  return {
    day: DAY_MAP[dayIndex],
    time: `${hour}:${minute}`,
  };
}
