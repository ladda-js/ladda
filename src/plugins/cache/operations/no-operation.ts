import { ApiFunction, Config, Entity } from '../../../types';
import { Cache, invalidateQuery } from '../cache';

export function decorateNoOperation<R, A extends any[]>(
  config: Config,
  cache: Cache,
  notify: (args:A, r:null)=>void,
  e: Entity,
  aFn: ApiFunction<R, A>
) {
  return async(...args: A) => {
    const r = aFn(...args);
    invalidateQuery(cache, e, aFn);
    notify(args, null);
    return r;
  };
}
