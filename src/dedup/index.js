const toKey = (args) => JSON.stringify(args);

export const dedup = () => ({ apiFn }) => {
  if (apiFn.operation !== 'READ') { return apiFn; }
  const cache = {};

  return (...args) => {
    const key = toKey(args);
    const cached = cache[key];
    if (cached) { return cached; }

    const promise = apiFn(...args);
    cache[key] = promise;
    return promise.then((res) => {
      delete cache[key];
      return res;
    });
  };
};
