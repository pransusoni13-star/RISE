export function createSerializedMutationQueue() {
  let tail: Promise<void> = Promise.resolve();

  return function runMutation<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
