import test from "node:test";
import assert from "node:assert/strict";
import { celebrateShot, normalizeRoomCode, scorePower } from "../src/game-rules.js";
import {
  COURSE_CUP,
  COURSE_LIBRARY_SIZE,
  buildCourseOrder,
  drawNextCourse,
  generateCourseLayout,
} from "../src/course-library.js";

test("shot celebrations follow the PRD tiers", () => {
  assert.equal(celebrateShot(1, 4), "Hole in one");
  assert.equal(celebrateShot(2, 4), "Eagle");
  assert.equal(celebrateShot(3, 4), "Birdie");
  assert.equal(celebrateShot(4, 4), "Course clear");
});

test("room codes are cross-device friendly", () => {
  assert.equal(normalizeRoomCode(" gm-4x 9 "), "GM4X9");
  assert.equal(normalizeRoomCode("abcdefgh"), "ABCDEF");
});

test("drag distance maps to a safe shot strength", () => {
  assert.equal(scorePower(0), 0);
  assert.equal(scorePower(30), 25);
  assert.equal(scorePower(120), 100);
  assert.equal(scorePower(500), 100);
});

test("course cycle visits every library course before repeating", () => {
  let cycle = { seed: 8675309, cursor: 0 };
  let previousCourseId = null;
  const played = [];

  for (let index = 0; index < COURSE_LIBRARY_SIZE; index += 1) {
    const selection = drawNextCourse(cycle, previousCourseId);
    played.push(selection.courseId);
    previousCourseId = selection.courseId;
    cycle = selection.cycle;
  }

  assert.equal(new Set(played).size, COURSE_LIBRARY_SIZE);
  const nextCycle = drawNextCourse(cycle, previousCourseId);
  assert.notEqual(nextCycle.courseId, previousCourseId);
});

test("a reshuffle keeps the previous recent window out of the next window", () => {
  const previousOrder = buildCourseOrder(COURSE_LIBRARY_SIZE, 424242);
  const recent = previousOrder.slice(-12);
  let cycle = { seed: 424242, cursor: COURSE_LIBRARY_SIZE };
  const nextWindow = [];

  for (let index = 0; index < recent.length; index += 1) {
    const selection = drawNextCourse(cycle, recent);
    nextWindow.push(selection.courseId);
    cycle = selection.cycle;
  }

  assert.equal(nextWindow.some((courseId) => recent.includes(courseId)), false);
});

test("course order is deterministic and layouts are genuinely distinct", () => {
  assert.deepEqual(buildCourseOrder(20, 2026), buildCourseOrder(20, 2026));

  const signatures = new Set();
  for (let courseId = 1; courseId <= COURSE_LIBRARY_SIZE; courseId += 1) {
    const layout = generateCourseLayout(courseId);
    signatures.add(JSON.stringify({
      start: layout.start,
      cup: layout.cup,
      walls: layout.walls,
      spinner: layout.spinner,
      wind: layout.wind,
    }));
  }
  assert.equal(signatures.size, COURSE_LIBRARY_SIZE);
});

test("the enlarged cup is visible and forgiving", () => {
  assert.ok(COURSE_CUP.visualRadius >= 24);
  assert.ok(COURSE_CUP.captureRadius >= 23);
  assert.ok(COURSE_CUP.magnetRadius > COURSE_CUP.visualRadius);
});
