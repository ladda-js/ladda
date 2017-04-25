import { reduce } from 'ladda-fp';

const toKey = (args) => JSON.stringify(args);

const isActive = reduce(
    (active, conf = {}) => active && (conf.enableDeduplication ||
                                      conf.enableDeduplication === undefined),
    true
);

export const dedup = ({ config }) => ({ entity, fn }) => {
  if (fn.operation !== 'READ') { return fn; }
  const cache = {};

  return (...args) => {
    if (!isActive([config, entity, fn])) {
      return fn(...args);
    }

    const key = toKey(args);
    const cached = cache[key];
    if (cached) { return cached; }

    const promise = fn(...args);
    cache[key] = promise;
    const cleanup = () => delete cache[key];

    return promise.then((res) => {
      cleanup();
      return res;
    }, (err) => {
      cleanup();
      return Promise.reject(err);
    });
  };
};
