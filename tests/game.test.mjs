import test from "node:test";
import assert from "node:assert/strict";
import { celebrateShot, normalizeRoomCode, scorePower } from "../src/game-rules.js";

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
