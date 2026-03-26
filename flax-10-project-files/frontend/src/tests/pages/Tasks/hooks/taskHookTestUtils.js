export function createRejectablePromise() {
  let rejectPromise;
  const promise = new Promise((_, reject) => {
    rejectPromise = reject;
  });

  return { promise, rejectPromise };
}
