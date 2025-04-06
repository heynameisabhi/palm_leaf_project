export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60 * 60, "minute"],
    [60 * 60 * 24, "hour"],
    [60 * 60 * 24 * 7, "day"],
    [60 * 60 * 24 * 30, "week"],
    [60 * 60 * 24 * 365, "month"],
    [Infinity, "year"],
  ];

  for (let i = 0; i < ranges.length; i++) {
    const [threshold, unit] = ranges[i];
    const value = seconds / threshold;
    if (value < 1) continue;
    const rounded = Math.floor(value);
    return rtf.format(-rounded, unit);
  }

  return "just now";
}
