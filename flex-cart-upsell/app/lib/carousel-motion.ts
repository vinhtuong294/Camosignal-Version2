type MotionOptions = {
  read: () => number;
  write: (position: number) => void;
  requestFrame: (callback: (time: number) => void) => number;
  cancelFrame: (id: number) => void;
  reducedMotion: () => boolean;
  onActive: (active: boolean) => void;
  onFinish: () => void;
};

// Critically damped motion retains velocity when another arrow click retargets it.
export function carouselMotionStep(
  position: number,
  velocity: number,
  target: number,
  seconds: number,
) {
  const frequency = 24;
  const offset = position - target;
  const impulse = velocity + frequency * offset;
  const decay = Math.exp(-frequency * seconds);
  const nextPosition = target + (offset + impulse * seconds) * decay;
  const nextVelocity = (velocity - frequency * impulse * seconds) * decay;
  if ((target - position) * (target - nextPosition) < 0) {
    return { position: target, velocity: 0 };
  }
  return { position: nextPosition, velocity: nextVelocity };
}

export function createCarouselMotion(options: MotionOptions) {
  let frame: number | undefined;
  let target: number | null = null;
  let position = 0;
  let velocity = 0;
  let previousTime: number | undefined;

  const stop = () => {
    if (frame !== undefined) options.cancelFrame(frame);
    frame = undefined;
    target = null;
    previousTime = undefined;
    velocity = 0;
    options.onActive(false);
  };

  const tick = (time: number) => {
    frame = undefined;
    if (target === null) return;
    const seconds =
      previousTime === undefined
        ? 1 / 60
        : Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
    previousTime = time;
    ({ position, velocity } = carouselMotionStep(
      position,
      velocity,
      target,
      seconds,
    ));
    if (Math.abs(position - target) < 1 && Math.abs(velocity) < 35) {
      options.write(target);
      stop();
      options.onFinish();
      return;
    }
    options.write(position);
    frame = options.requestFrame(tick);
  };

  return {
    get active() {
      return target !== null;
    },
    to(destination: number) {
      if (!Number.isFinite(destination)) return;
      if (options.reducedMotion()) {
        stop();
        options.onActive(true);
        options.write(destination);
        options.onActive(false);
        options.onFinish();
        return;
      }
      if (target === null) {
        position = options.read();
        velocity = 0;
        previousTime = undefined;
      }
      target = destination;
      options.onActive(true);
      if (frame === undefined) frame = options.requestFrame(tick);
    },
    stop,
  };
}
