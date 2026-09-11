const POSITION_TOLERANCE = 1;

/** Include the clipped final viewport, which is rarely a whole card step. */
export function carouselSnapPositions(
  offsets: number[],
  maximumScroll: number,
) {
  const maximum = Math.max(0, maximumScroll);
  const positions = [0, ...offsets, maximum]
    .filter(Number.isFinite)
    .map((position) => Math.min(maximum, Math.max(0, position)))
    .sort((left, right) => left - right);

  return positions.filter(
    (position, index) =>
      index === 0 || position - positions[index - 1] > POSITION_TOLERANCE,
  );
}

export function nextCarouselPosition(
  positions: number[],
  current: number,
  direction: number,
) {
  if (direction > 0) {
    return (
      positions.find((position) => position > current + POSITION_TOLERANCE) ??
      positions.at(-1) ??
      0
    );
  }
  return (
    [...positions]
      .reverse()
      .find((position) => position < current - POSITION_TOLERANCE) ??
    positions[0] ??
    0
  );
}
