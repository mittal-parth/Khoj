/**
 * Format a date range from two bigint timestamps into a human-readable string
 * If same day, shows: "Jan 1 • 9:00 AM - 5:00 PM"
 * If different days, shows: "Jan 1 9:00 AM - Jan 2 5:00 PM"
 */
export function formatDateRange(startTime: bigint, endTime: bigint): string {
  const startDate = new Date(Number(startTime) * 1000);
  const endDate = new Date(Number(endTime) * 1000);

  // If same day, show time range
  if (startDate.toDateString() === endDate.toDateString()) {
    return `${startDate.toLocaleDateString([], { month: "short", day: "numeric" })} • ${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  // Different days, show date range with times
  return `${startDate.toLocaleDateString([], { month: "short", day: "numeric" })} ${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleDateString([], { month: "short", day: "numeric" })} ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
