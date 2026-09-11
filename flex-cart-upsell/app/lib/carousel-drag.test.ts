import assert from "node:assert/strict";
import test from "node:test";
import { enableHorizontalDrag } from "./carousel-drag.ts";

function fixture() {
  const classes = new Set<string>();
  const pointers = new Set<number>();
  let starts = 0,
    ends = 0,
    endedWhileSnapDisabled = false;
  let endState: { dragged: boolean; startScrollLeft: number } | undefined;
  const scroller = Object.assign(new EventTarget(), {
    scrollLeft: 0,
    control: false,
    closest() {
      return this.control ? this : null;
    },
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
    },
    setPointerCapture: (id: number) => pointers.add(id),
    hasPointerCapture: (id: number) => pointers.has(id),
    releasePointerCapture: (id: number) => pointers.delete(id),
  });
  const cleanup = enableHorizontalDrag(scroller as unknown as HTMLElement, {
    onStart: () => {
      starts++;
    },
    onEnd: (state) => {
      ends++;
      endState = state;
      endedWhileSnapDisabled = classes.has("is-dragging");
    },
  });
  return {
    scroller,
    classes,
    pointers,
    cleanup,
    get starts() {
      return starts;
    },
    get ends() {
      return ends;
    },
    get endState() {
      return endState;
    },
    get endedWhileSnapDisabled() {
      return endedWhileSnapDisabled;
    },
    event(type: string, clientX = 200, pointerType = "mouse") {
      const event = Object.assign(new Event(type, { cancelable: true }), {
        clientX,
        pointerType,
        pointerId: 1,
        button: 0,
      });
      scroller.dispatchEvent(event);
      return event;
    },
  };
}

test("mouse drag follows the pointer and starts settling before snap is restored", () => {
  const f = fixture();
  f.event("pointerdown");
  assert.equal(f.starts, 1);
  assert.equal(f.pointers.size, 0);
  f.event("pointermove", 198);
  assert.equal(f.scroller.scrollLeft, 0);
  f.event("pointermove", 100);
  assert.equal(f.scroller.scrollLeft, 100);
  assert.equal(f.pointers.size, 1);
  f.event("pointerup", 100);
  assert.deepEqual(f.endState, { dragged: true, startScrollLeft: 0 });
  assert.equal(f.endedWhileSnapDisabled, true);
  assert.equal(f.classes.has("is-dragging"), false);
  assert.equal(f.pointers.size, 0);
  assert.equal(f.event("click").defaultPrevented, true);
  f.cleanup();
});

test("plain clicks retain normal link behavior and no pointer capture", () => {
  const f = fixture();
  f.event("pointerdown");
  f.event("pointerup");
  assert.equal(f.pointers.size, 0);
  assert.equal(f.event("click").defaultPrevented, false);
  assert.equal(f.endState?.dragged, false);
  f.cleanup();
});

test("native touch gestures and variant controls are not captured as mouse drags", () => {
  const f = fixture();
  f.event("pointerdown", 200, "touch");
  f.scroller.control = true;
  f.event("pointerdown");
  assert.equal(f.starts, 0);
  assert.equal(f.classes.size, 0);
  f.cleanup();
});

test("canceled gestures settle once; teardown removes listeners and capture", () => {
  const f = fixture();
  f.event("pointerdown");
  f.event("pointermove", 100);
  f.event("pointercancel", 100);
  f.event("lostpointercapture", 100);
  assert.equal(f.ends, 1);
  f.event("pointerdown");
  f.event("pointermove", 80);
  f.cleanup();
  f.event("pointermove", 40);
  f.event("pointerup", 40);
  assert.equal(f.ends, 1);
  assert.equal(f.classes.size, 0);
  assert.equal(f.pointers.size, 0);
});
