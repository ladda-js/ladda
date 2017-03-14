import { reduce } from '../fp';

const toKey = (args) => JSON.stringify(args);

const isActive = reduce((active, conf = {}) => active && !conf.noDedup, true);

export const dedup = ({ config }) => ({ entity, apiFn }) => {
  if (apiFn.operation !== 'READ') { return apiFn; }
  const cache = {};

  return (...args) => {
    if (!isActive([config, entity, apiFn])) {
      return apiFn(...args);
    }

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
