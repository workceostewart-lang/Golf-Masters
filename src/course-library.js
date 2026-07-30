export const COURSE_LIBRARY_SIZE = 1500;

export const COURSE_CUP = Object.freeze({
  visualRadius: 24,
  ringRadius: 30,
  captureRadius: 23,
  magnetRadius: 52,
});

const COURSE_NAMES = [
  "Coastal Circuit",
  "Emerald Run",
  "Coral Crossing",
  "Bluewater Bend",
  "Redwood Reach",
  "Harbor Heights",
  "Cypress Current",
  "Sunset Switchback",
  "Lagoon Links",
  "Fantom Fairway",
];

const DIFFICULTIES = ["Relaxed", "Technical", "Tricky", "Expert"];

function normalizeSeed(seed) {
  const normalized = Number(seed) >>> 0;
  return normalized || 0x6d2b79f5;
}

function seededRandom(seed) {
  let state = normalizeSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function nextSeed(seed) {
  return normalizeSeed(Math.imul(normalizeSeed(seed) ^ 0x9e3779b9, 0x85ebca6b));
}

export function buildCourseOrder(total = COURSE_LIBRARY_SIZE, seed = 1) {
  const size = Math.max(1, Math.trunc(total));
  const random = seededRandom(seed);
  const order = Array.from({ length: size }, (_, index) => index + 1);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
}

export function drawNextCourse(cycle = {}, recentCourseIds = [], total = COURSE_LIBRARY_SIZE) {
  const size = Math.max(1, Math.trunc(total));
  const recent = (Array.isArray(recentCourseIds) ? recentCourseIds : [recentCourseIds])
    .filter((courseId) => Number.isInteger(courseId) && courseId >= 1 && courseId <= size);
  let seed = normalizeSeed(cycle.seed);
  let cursor = Number.isInteger(cycle.cursor) && cycle.cursor >= 0 ? cycle.cursor : 0;
  let order = buildCourseOrder(size, seed);

  if (cursor >= size) {
    seed = nextSeed(seed);
    cursor = 0;
    order = buildCourseOrder(size, seed);

    const protectedWindow = Math.min(recent.length, Math.floor(size / 2));
    let attempts = 0;
    while (
      protectedWindow > 0
      && order.slice(0, protectedWindow).some((courseId) => recent.includes(courseId))
      && attempts < 64
    ) {
      seed = nextSeed(seed);
      order = buildCourseOrder(size, seed);
      attempts += 1;
    }
  }

  return {
    courseId: order[cursor],
    cycle: { seed, cursor: cursor + 1 },
  };
}

export function generateCourseLayout(courseId) {
  const id = Math.min(COURSE_LIBRARY_SIZE, Math.max(1, Math.trunc(courseId)));
  const random = seededRandom(Math.imul(id, 0x45d9f3b) ^ 0xa5a5a5a5);
  const range = (minimum, maximum) => minimum + (maximum - minimum) * random();
  const wallRows = [548, 442, 334, 226];
  const wallCount = 3 + (id % 3 === 0 ? 1 : 0);
  const walls = wallRows.slice(0, wallCount).map((y, index) => {
    const width = Math.round(range(104, 166));
    const leftAnchored = (id + index) % 2 === 0;
    const edgeInset = range(20, 46);
    return {
      x: Math.round(leftAnchored ? edgeInset + width / 2 : 420 - edgeInset - width / 2),
      y: Math.round(y + range(-24, 24)),
      w: width,
      h: Math.round(range(16, 22)),
      a: Number(range(-0.28, 0.28).toFixed(3)),
    };
  });

  const windAngle = range(-0.9, 0.9);
  const windStrength = range(0.000018, 0.000032);
  const nameIndex = (id * 7 + Math.floor(random() * COURSE_NAMES.length)) % COURSE_NAMES.length;
  const spinnerLanes = [280, 386, 494];

  return {
    id,
    name: COURSE_NAMES[nameIndex],
    difficulty: DIFFICULTIES[Math.min(3, Math.floor((walls.length - 2) + random() * 2))],
    start: { x: Math.round(range(105, 315)), y: Math.round(range(650, 704)) },
    cup: { x: Math.round(range(72, 348)), y: Math.round(range(72, 128)) },
    walls,
    spinner: {
      x: Math.round(range(132, 288)),
      y: Math.round(spinnerLanes[id % spinnerLanes.length] + range(-10, 10)),
      width: Math.round(range(108, 152)),
      speed: Number(range(0.00042, 0.00082).toFixed(6)) * (id % 2 === 0 ? 1 : -1),
      angle: Number(range(-0.5, 0.5).toFixed(3)),
    },
    wind: {
      x: Math.round(range(72, 132)),
      y: Math.round(range(424, 492)),
      width: Math.round(range(210, 280)),
      height: Math.round(range(92, 132)),
      force: {
        x: Number((Math.cos(windAngle) * windStrength).toFixed(8)),
        y: Number((-Math.sin(windAngle) * windStrength).toFixed(8)),
      },
    },
    fairwayColor: [0x48c978, 0x42c47b, 0x55c96f, 0x3fc487][id % 4],
  };
}
