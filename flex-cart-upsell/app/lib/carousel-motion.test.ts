import assert from "node:assert/strict";
import test from "node:test";
import { carouselMotionStep, createCarouselMotion } from "./carousel-motion.ts";

function fixture(reduced = false) {
  let position = 0,
    time = 0,
    id = 0,
    finished = 0,
    active = false;
  const frames = new Map<number, (time: number) => void>();
  const samples: number[] = [];
  const motion = createCarouselMotion({
    read: () => position,
    write: (value) => {
      position = value;
      samples.push(value);
    },
    requestFrame: (callback) => {
      frames.set(++id, callback);
      return id;
    },
    cancelFrame: (frame) => {
      frames.delete(frame);
    },
    reducedMotion: () => reduced,
    onActive: (value) => {
      active = value;
    },
    onFinish: () => {
      finished++;
    },
  });
  return {
    motion,
    samples,
    get position() {
      return position;
    },
    get active() {
      return active;
    },
    get finished() {
      return finished;
    },
    get pendingFrames() {
      return frames.size;
    },
    step() {
      time += 1000 / 60;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(time));
    },
    settle() {
      for (let i = 0; i < 120 && frames.size; i++) this.step();
    },
  };
}

test("carousel starts on the first frame, settles exactly, and never snaps backward", () => {
  const f = fixture();
  f.motion.to(242);
  f.step();
  assert.ok(f.position > 0);
  f.settle();
  assert.equal(f.position, 242);
  assert.equal(f.finished, 1);
  assert.equal(f.active, false);
  assert.equal(f.pendingFrames, 0);
  assert.ok(
    f.samples.every((value, i) => i === 0 || value >= f.samples[i - 1]),
  );
  assert.ok(
    Math.max(...f.samples.map((value, i) => value - (f.samples[i - 1] ?? 0))) <
      40,
  );
});

test("rapid clicks keep one animation loop and preserve movement toward the new target", () => {
  const f = fixture();
  f.motion.to(242);
  f.step();
  f.step();
  f.step();
  const previous = f.position;
  f.motion.to(484);
  assert.equal(f.pendingFrames, 1);
  f.step();
  assert.ok(f.position > previous);
  f.settle();
  assert.equal(f.position, 484);
  assert.equal(f.finished, 1);
});

test("reversing direction settles at the new destination without overshooting", () => {
  const f = fixture();
  f.motion.to(726);
  for (let i = 0; i < 6; i++) f.step();
  f.motion.to(0);
  f.settle();
  assert.equal(f.position, 0);
  assert.ok(f.samples.every((value) => value >= 0 && value <= 726));
});

test("pointer interruption and cleanup cancel all pending movement", () => {
  const f = fixture();
  f.motion.to(367);
  f.step();
  f.motion.stop();
  const position = f.position;
  f.step();
  assert.equal(f.position, position);
  assert.equal(f.pendingFrames, 0);
  assert.equal(f.active, false);
  assert.equal(f.finished, 0);
});

test("reduced motion jumps directly without scheduling animation", () => {
  const f = fixture(true);
  f.motion.to(367);
  assert.equal(f.position, 367);
  assert.equal(f.pendingFrames, 0);
  assert.equal(f.active, false);
  assert.equal(f.finished, 1);
});

test("high incoming velocity cannot carry a card beyond the target", () => {
  assert.deepEqual(carouselMotionStep(241, 2000, 242, 1 / 60), {
    position: 242,
    velocity: 0,
  });
});
