import {
  ApiFunction, Config, Entity, Plugin, ApiCall
} from '../../types';

const toKey = (args:any) => JSON.stringify(args);

export interface DupConfig {
  enableDeduplication?: boolean
}

const isActive = (configs:(DupConfig|undefined)[]) => configs.every(
  c => c?.enableDeduplication ?? true
);

// @ts-ignore Variance issue that won't be a problem in practice
export const dedupPlugin:Plugin = (
  {
    config
  }: {
    config: Config & DupConfig
  }
) => <R, A extends any[]>(
  {
    entity,
    fn
  }:{
    entity: Entity & DupConfig,
    fn: ApiFunction<R, A> & DupConfig
  }
):ApiCall<R, A> => {
  if (fn.operation !== 'READ') { return fn; }
  const cache:{[key: string]: Promise<R>} = {};

  return (...args:A) => {
    // These three lines could be moved to the start of the outer function
    if (!isActive([config, entity, fn])) {
      return fn(...args);
    }

    const key = toKey(args);
    const cached = cache[key];
    if (cached) { return cached; }

    const promise = fn(...args);
    cache[key] = promise;
    const cleanup = () => delete cache[key];

    // This return value is what should be in the cache, not the bare request
    // Currently, every parallel requester will perform a cleanup
    // Instead only the initial requester, who put the request IN the cache should do the cleanup
    return promise.then((res) => {
      cleanup();
      return res;
    }, (err) => {
      cleanup();
      return Promise.reject(err);
    });
  };
};
