import assert from "node:assert/strict";
import test from "node:test";
import {
  carouselSnapPositions,
  nextCarouselPosition,
} from "./carousel-navigation.ts";

test("drawer navigation returns from the clipped end to the previous card without overshooting", () => {
  const positions = carouselSnapPositions(
    [0, 227.078, 454.156, 681.234, 908.312],
    639,
  );
  assert.deepEqual(positions, [0, 227.078, 454.156, 639]);
  assert.equal(nextCarouselPosition(positions, 639, -1), 454.156);
  assert.equal(nextCarouselPosition(positions, 454, -1), 227.078);
  assert.equal(nextCarouselPosition(positions, 454, 1), 639);
});

test("rapid clicks advance from the pending destination and reverse to a real snap point", () => {
  const positions = carouselSnapPositions([0, 252, 504, 756, 1008], 688);
  let target = 0;
  for (let i = 0; i < 3; i++)
    target = nextCarouselPosition(positions, target, 1);
  assert.equal(target, 688);
  assert.equal(nextCarouselPosition(positions, target, -1), 504);
  assert.equal(nextCarouselPosition(positions, target, 1), 688);
});

test("drawer navigation handles partial swipes, rounded pixels, and resized viewports", () => {
  const positions = carouselSnapPositions([0, 212, 424, 636, 848], 684);
  assert.equal(nextCarouselPosition(positions, 300, -1), 212);
  assert.equal(nextCarouselPosition(positions, 300, 1), 424);
  assert.equal(nextCarouselPosition(positions, 423.8, 1), 636);
  assert.equal(nextCarouselPosition(positions, 424.2, -1), 212);
});

test("a single card or non-overflowing list has no extra destinations", () => {
  assert.deepEqual(carouselSnapPositions([0, 212], 0), [0]);
  assert.equal(nextCarouselPosition([0], 0, 1), 0);
  assert.equal(nextCarouselPosition([0], 0, -1), 0);
  assert.equal(nextCarouselPosition([], 0, 1), 0);
});
