/**
 * Utility to parse and sort waves.
 * Wave format: "20 April ⏰ 10 AM - 12 PM"
 */

export const WAVES = {
  WAVE_1: "27 April ⏰ 09:30 AM - 11:30 AM",
  WAVE_2: "27 April ⏰ 12:30 PM - 02:30 PM"
};

export const STANDARD_WAVES = [WAVES.WAVE_1, WAVES.WAVE_2];

export const parseWave = (wave: string) => {
  const parts = wave.split('⏰');
  const datePart = parts[0]?.trim() || '';
  const timePart = parts[1]?.trim() || '';
  return { date: datePart, time: timePart };
};

export const sortWaves = (waves: string[]): string[] => {
  // Since there are only 2 fixed waves, we can just filter STANDARD_WAVES by what exists
  return STANDARD_WAVES.filter(w => waves.includes(w));
};

