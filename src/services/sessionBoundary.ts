/** Invalidates asynchronous work when the member changes or signs out. */
export function createSessionBoundary() {
  let generation = 0;
  return {
    capture: () => generation,
    invalidate: () => ++generation,
    isCurrent: (captured: number) => captured === generation,
  };
}
