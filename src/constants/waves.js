export const WAVE_1 = "27 April ⏰ 09:30 AM - 11:30 AM";
export const WAVE_2 = "27 April ⏰ 12:30 PM - 02:30 PM";

export const WAVE_LABELS = {
  [WAVE_1]: "Wave 1 — 27 Apr 09:30 AM - 11:30 AM",
  [WAVE_2]: "Wave 2 — 27 Apr 12:30 PM - 02:30 PM",
};

export const UNIQUE_TEAMS = ["A", "B", "C", "D"];

// Smart wave matcher — handles emoji/spacing variants
export function matchWave(empWave, targetWave) {
  if (!empWave || !targetWave) return false;
  
  const normalize = (s) =>
    String(s)
      .replace(/⏰/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  
  return normalize(empWave) === normalize(targetWave);
}

// Detect which wave an employee belongs to
export function detectWave(empWave) {
  if (!empWave) return null;
  const norm = String(empWave).toLowerCase();
  
  if (norm.includes("09:30")) return WAVE_1;
  if (norm.includes("12:30")) return WAVE_2;
  
  return null;
}
