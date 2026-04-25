export function parseWave(waveStr) {
  if (!waveStr || typeof waveStr !== "string") {
    return { date: "—", time: "—" };
  }

  const s = waveStr
    .replace(/\s+/g, " ")
    .trim();

  // Find first time occurrence like "09:30 AM" or "12:30 PM"
  const timeMatch = s.match(/\b\d{1,2}:\d{2}\s?(AM|PM)\b/i);

  if (!timeMatch) {
    // No time found → treat whole thing as date label
    return { date: s || "—", time: "—" };
  }

  const timeIndex = timeMatch.index ?? -1;
  const datePart = s.slice(0, timeIndex).trim()
    // remove any broken/extra symbols between date and time
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const timePart = s.slice(timeIndex).trim()
    // remove any broken symbol that may appear before time
    .replace(/^[^\d]+/, "")
    .trim();

  return {
    date: datePart || "—",
    time: timePart || "—",
  };
}
