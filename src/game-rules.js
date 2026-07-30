export function celebrateShot(shots, expectedShots = 4) {
  if (shots === 1) return "Hole in one";
  if (shots <= expectedShots - 2) return "Eagle";
  if (shots === expectedShots - 1) return "Birdie";
  return "Course clear";
}

export function normalizeRoomCode(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

export function scorePower(distance) {
  return Math.round(Math.min(100, Math.max(0, distance / 1.2)));
}
